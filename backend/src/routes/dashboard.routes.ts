import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import {
  getBalanceEvolution,
  getBudgetGauges,
  getCategoryBreakdown,
  getMonthlyComparison,
} from "../services/dashboard.service";
import { getCoachReport } from "../services/coach.service";
import { isPremiumActive } from "../utils/plan";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

async function resolveMonthsAllowed(userId: string, requested: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const premium = user ? isPremiumActive(user) : false;
  const cap = premium ? 12 : 1;
  return Math.min(Math.max(requested, 1), cap);
}

dashboardRouter.get("/summary", async (req, res) => {
  const now = new Date();
  const income = await prisma.transaction.aggregate({
    where: {
      userId: req.userId,
      type: "INCOME",
      date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
    },
    _sum: { amount: true },
  });
  const breakdown = await getCategoryBreakdown(req.userId!);
  const gauges = await getBudgetGauges(req.userId!);
  const evolution = await getBalanceEvolution(req.userId!, 1);
  const coach = await getCoachReport(req.userId!);

  res.json({
    monthIncome: Number(income._sum.amount ?? 0),
    monthExpense: breakdown.total,
    balance: evolution[evolution.length - 1]?.balance ?? 0,
    categoryBreakdown: breakdown.categories,
    budgetGauges: gauges,
    coach: {
      score: coach.score,
      scoreStatus: coach.scoreStatus,
      scoreLabel: coach.scoreLabel,
      topInsights: coach.insights.slice(0, 3),
    },
  });
});

dashboardRouter.get("/monthly-comparison", async (req, res) => {
  const requested = Number(req.query.months ?? 6);
  const months = await resolveMonthsAllowed(req.userId!, requested);
  const data = await getMonthlyComparison(req.userId!, months);
  res.json({ months: data, limited: months < requested });
});

dashboardRouter.get("/balance-evolution", async (req, res) => {
  const requested = Number(req.query.months ?? 6);
  const months = await resolveMonthsAllowed(req.userId!, requested);
  const data = await getBalanceEvolution(req.userId!, months);
  res.json({ points: data, limited: months < requested });
});
