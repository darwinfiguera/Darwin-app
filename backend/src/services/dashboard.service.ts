import { prisma } from "../lib/prisma";
import { alertMessage, statusForPercent } from "../utils/alerts";

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

interface MonthWindow {
  key: string;
  label: string;
  start: Date;
  end: Date;
  isCurrent: boolean;
}

function buildMonthWindows(count: number, now = new Date()): MonthWindow[] {
  const windows: MonthWindow[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    windows.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_LABELS[start.getMonth()],
      start,
      end,
      isCurrent: i === 0,
    });
  }
  return windows;
}

export async function getCategoryBreakdown(userId: string, monthStart?: Date) {
  const now = new Date();
  const start = monthStart ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);

  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  const categoryIds = grouped.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const rows = grouped
    .map((g) => {
      const category = categoryById.get(g.categoryId);
      return {
        categoryId: g.categoryId,
        name: category?.name ?? "Otros",
        icon: category?.icon ?? "🔖",
        color: category?.color ?? "#8B899B",
        amount: Number(g._sum.amount ?? 0),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  return {
    total,
    categories: rows.map((r) => ({ ...r, percent: total > 0 ? Math.round((r.amount / total) * 1000) / 10 : 0 })),
  };
}

export async function getMonthlyComparison(userId: string, monthsCount: number) {
  const windows = buildMonthWindows(monthsCount);
  const results = [];
  for (const w of windows) {
    const agg = await prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: w.start, lt: w.end } },
      _sum: { amount: true },
    });
    results.push({ key: w.key, label: w.label, total: Number(agg._sum.amount ?? 0), isCurrent: w.isCurrent });
  }
  return results;
}

export async function getBalanceEvolution(userId: string, monthsCount: number) {
  const windows = buildMonthWindows(monthsCount);
  const now = new Date();
  const cutoffs = windows.map((w) => (w.isCurrent ? now : w.end));

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { lte: cutoffs[cutoffs.length - 1] } },
    orderBy: { date: "asc" },
    select: { amount: true, type: true, date: true },
  });

  let idx = 0;
  let running = 0;
  const points = [];
  for (let i = 0; i < cutoffs.length; i++) {
    while (idx < transactions.length && transactions[idx].date <= cutoffs[i]) {
      const amt = Number(transactions[idx].amount);
      running += transactions[idx].type === "INCOME" ? amt : -amt;
      idx++;
    }
    points.push({ key: windows[i].key, label: windows[i].label, balance: Math.round(running * 100) / 100 });
  }
  return points;
}

export async function getBudgetGauges(userId: string, monthStart?: Date) {
  const budgets = await prisma.budget.findMany({ where: { userId }, include: { category: true } });
  const breakdown = await getCategoryBreakdown(userId, monthStart);
  const spentByCategory = new Map(breakdown.categories.map((c) => [c.categoryId, c.amount]));

  return budgets.map((b) => {
    const spent = spentByCategory.get(b.categoryId) ?? 0;
    const limit = Number(b.monthlyLimit);
    const percent = limit > 0 ? Math.round((spent / limit) * 1000) / 10 : 0;
    return {
      categoryId: b.categoryId,
      name: b.category.name,
      icon: b.category.icon,
      color: b.category.color,
      spent,
      limit,
      percent,
      status: statusForPercent(percent),
      message: alertMessage(b.category.name, percent),
    };
  });
}
