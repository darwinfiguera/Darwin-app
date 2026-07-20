import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const budgetsRouter = Router();
budgetsRouter.use(requireAuth);

budgetsRouter.get("/", async (req, res) => {
  const budgets = await prisma.budget.findMany({
    where: { userId: req.userId },
    include: { category: true },
  });
  res.json({ budgets });
});

const upsertSchema = z.object({
  categoryId: z.string(),
  monthlyLimit: z.number().positive(),
});

budgetsRouter.put("/", async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const { categoryId, monthlyLimit } = parsed.data;

  const budget = await prisma.budget.upsert({
    where: { userId_categoryId: { userId: req.userId!, categoryId } },
    update: { monthlyLimit },
    create: { userId: req.userId!, categoryId, monthlyLimit },
    include: { category: true },
  });
  res.json({ budget });
});

budgetsRouter.delete("/:categoryId", async (req, res) => {
  await prisma.budget
    .delete({ where: { userId_categoryId: { userId: req.userId!, categoryId: req.params.categoryId } } })
    .catch(() => null);
  res.status(204).end();
});
