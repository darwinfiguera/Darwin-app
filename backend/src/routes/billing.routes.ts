import express, { Router } from "express";
import type Stripe from "stripe";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";
import { requireAuth } from "../middleware/auth";

export const billingRouter = Router();

billingRouter.post("/checkout-session", requireAuth, async (req, res) => {
  if (!stripe) return void res.status(500).json({ error: "Stripe no está configurado en el servidor." });

  const { plan } = req.body as { plan?: "MONTHLY" | "ANNUAL" };
  const priceId = plan === "ANNUAL" ? env.stripePriceAnnual : env.stripePriceMonthly;
  if (!priceId) return res.status(500).json({ error: "Falta configurar el precio de Stripe para ese plan." });

  const user = await prisma.user.findUnique({ where: { id: req.userId }, include: { subscription: true } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  let customerId = user.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.appUrl}/billing/success`,
    cancel_url: `${env.appUrl}/billing/cancel`,
    metadata: { userId: user.id },
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: { stripeCustomerId: customerId },
    create: { userId: user.id, stripeCustomerId: customerId },
  });

  res.json({ url: session.url });
});

billingRouter.post("/portal-session", requireAuth, async (req, res) => {
  if (!stripe) return void res.status(500).json({ error: "Stripe no está configurado en el servidor." });
  const sub = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  if (!sub?.stripeCustomerId) return res.status(404).json({ error: "No hay una suscripción asociada." });

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: env.appUrl,
  });
  res.json({ url: portal.url });
});

billingRouter.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return void res.status(500).end();
  const signature = req.headers["stripe-signature"];
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature as string, env.stripeWebhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${(err as Error).message}`);
  }

  async function activatePremium(userId: string, subscription: Stripe.Subscription) {
    const periodEnd = new Date(subscription.current_period_end * 1000);
    await prisma.user.update({ where: { id: userId }, data: { plan: "PREMIUM", premiumUntil: periodEnd } });
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: periodEnd,
      },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await activatePremium(userId, subscription);
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await prisma.subscription.findFirst({ where: { stripeCustomerId: subscription.customer as string } });
      if (sub) await activatePremium(sub.userId, subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await prisma.subscription.findFirst({ where: { stripeCustomerId: subscription.customer as string } });
      if (sub) {
        await prisma.user.update({ where: { id: sub.userId }, data: { plan: "FREE", premiumUntil: null } });
        await prisma.subscription.update({ where: { userId: sub.userId }, data: { status: "canceled" } });
      }
      break;
    }
  }

  res.json({ received: true });
});
