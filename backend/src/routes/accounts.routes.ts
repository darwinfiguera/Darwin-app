import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { FREE_LIMITS, isPremiumActive } from "../utils/plan";

export const accountsRouter = Router();
accountsRouter.use(requireAuth);

accountsRouter.get("/", async (req, res) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.userId, archived: false },
    orderBy: { createdAt: "asc" },
  });
  res.json({ accounts });
});

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["CASH", "CARD", "BANK"]).default("CASH"),
  icon: z.string().default("💵"),
  color: z.string().default("#5B4FE9"),
});

accountsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const premium = user ? isPremiumActive(user) : false;
  if (!premium) {
    const count = await prisma.account.count({ where: { userId: req.userId, archived: false } });
    if (count >= FREE_LIMITS.maxAccounts) {
      return res.status(403).json({
        error: `El plan gratuito incluye ${FREE_LIMITS.maxAccounts} cuenta. Pasate a Premium para agregar más.`,
        code: "PLAN_LIMIT",
      });
    }
  }

  const account = await prisma.account.create({ data: { ...parsed.data, userId: req.userId! } });
  res.status(201).json({ account });
});

const updateSchema = createSchema.partial();

accountsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const account = await prisma.account.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!account) return res.status(404).json({ error: "Cuenta no encontrada" });
  const updated = await prisma.account.update({ where: { id: account.id }, data: parsed.data });
  res.json({ account: updated });
});

accountsRouter.delete("/:id", async (req, res) => {
  const account = await prisma.account.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!account) return res.status(404).json({ error: "Cuenta no encontrada" });
  await prisma.account.update({ where: { id: account.id }, data: { archived: true } });
  res.status(204).end();
});
