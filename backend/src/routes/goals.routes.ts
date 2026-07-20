import type { Goal } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { celebrationMessage, goalNudgeMessage } from "../utils/alerts";
import { FREE_LIMITS, isPremiumActive } from "../utils/plan";

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

function withProgress(goal: Goal) {
  const target = Number(goal.targetAmount);
  const current = Number(goal.currentAmount);
  const percent = target > 0 ? Math.min(1000, Math.round((current / target) * 1000) / 10) : 0;
  return {
    ...goal,
    targetAmount: target,
    currentAmount: current,
    percent,
    nudgeMessage: goalNudgeMessage(percent),
  };
}

goalsRouter.get("/", async (req, res) => {
  const goals = await prisma.goal.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "asc" } });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const premium = user ? isPremiumActive(user) : false;

  const enriched = goals.map(withProgress);
  if (premium) return res.json({ goals: enriched, locked: [] });

  const active = enriched.filter((g) => g.status === "ACTIVE");
  const unlocked = active.slice(0, FREE_LIMITS.maxActiveGoals);
  const unlockedIds = new Set(unlocked.map((g) => g.id));
  const visible = enriched.map((g) => (g.status === "ACTIVE" && !unlockedIds.has(g.id) ? { ...g, locked: true } : g));
  res.json({ goals: visible });
});

const createSchema = z.object({
  name: z.string().min(1),
  icon: z.string().default("🎯"),
  targetAmount: z.number().positive(),
  targetDate: z.string().datetime().optional(),
});

goalsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const premium = user ? isPremiumActive(user) : false;
  if (!premium) {
    const activeCount = await prisma.goal.count({ where: { userId: req.userId, status: "ACTIVE" } });
    if (activeCount >= FREE_LIMITS.maxActiveGoals) {
      return res.status(403).json({
        error: `El plan gratuito incluye ${FREE_LIMITS.maxActiveGoals} meta activa. Pasate a Premium para crear más.`,
        code: "PLAN_LIMIT",
      });
    }
  }

  const { targetDate, ...rest } = parsed.data;
  const goal = await prisma.goal.create({
    data: { ...rest, userId: req.userId!, targetDate: targetDate ? new Date(targetDate) : undefined },
  });
  res.status(201).json({ goal: withProgress(goal) });
});

const updateSchema = createSchema.partial();

goalsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Meta no encontrada" });

  const { targetDate, ...rest } = parsed.data;
  const goal = await prisma.goal.update({
    where: { id: existing.id },
    data: { ...rest, ...(targetDate ? { targetDate: new Date(targetDate) } : {}) },
  });
  res.json({ goal: withProgress(goal) });
});

goalsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Meta no encontrada" });
  await prisma.goal.delete({ where: { id: existing.id } });
  res.status(204).end();
});

const contributionSchema = z.object({
  amount: z.number().positive(),
  note: z.string().optional(),
});

goalsRouter.post("/:id/contributions", async (req, res) => {
  const parsed = contributionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!goal) return res.status(404).json({ error: "Meta no encontrada" });

  await prisma.goalContribution.create({ data: { goalId: goal.id, amount: parsed.data.amount, note: parsed.data.note } });

  const newAmount = Number(goal.currentAmount) + parsed.data.amount;
  const wasCompleted = goal.status === "COMPLETED";
  const nowCompleted = newAmount >= Number(goal.targetAmount);
  const updated = await prisma.goal.update({
    where: { id: goal.id },
    data: { currentAmount: newAmount, status: nowCompleted ? "COMPLETED" : "ACTIVE" },
  });

  res.status(201).json({
    goal: withProgress(updated),
    celebration: !wasCompleted && nowCompleted ? celebrationMessage(goal.name) : null,
  });
});

goalsRouter.get("/:id/projection", async (req, res) => {
  const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!goal) return res.status(404).json({ error: "Meta no encontrada" });

  const contributions = await prisma.goalContribution.findMany({
    where: { goalId: goal.id },
    orderBy: { date: "asc" },
  });

  let running = 0;
  const actual = [{ date: goal.createdAt, amount: 0 }];
  for (const c of contributions) {
    running += Number(c.amount);
    actual.push({ date: c.date, amount: running });
  }

  const planned = goal.targetDate
    ? [
        { date: goal.createdAt, amount: 0 },
        { date: goal.targetDate, amount: Number(goal.targetAmount) },
      ]
    : [];

  res.json({ actual, planned, targetAmount: Number(goal.targetAmount), targetDate: goal.targetDate });
});
