import { prisma } from "../lib/prisma";
import { getBalanceEvolution, getMonthlyComparison } from "./dashboard.service";

export interface CoachInsight {
  id: string;
  type: "positive" | "info" | "warning" | "critical";
  icon: string;
  title: string;
  message: string;
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

async function getIncomeForMonth(userId: string, start: Date, end: Date) {
  const agg = await prisma.transaction.aggregate({
    where: { userId, type: "INCOME", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const logged = Number(agg._sum.amount ?? 0);
  if (logged > 0) return { amount: logged, estimated: false };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const estimated = Number(user?.estimatedMonthlyIncome ?? 0);
  return { amount: estimated, estimated: estimated > 0 };
}

/** The 50/30/20 rule: ~50% needs, ~30% wants, ~20% savings & debt repayment. */
async function get503020(userId: string) {
  const { start, end } = monthRange();
  const income = await getIncomeForMonth(userId, start, end);

  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  const categories = await prisma.category.findMany({ where: { id: { in: grouped.map((g) => g.categoryId) } } });
  const groupById = new Map(categories.map((c) => [c.id, c.group]));
  const debtCategoryIds = new Set(categories.filter((c) => c.name.toLowerCase() === "deudas").map((c) => c.id));

  let needs = 0;
  let wants = 0;
  let savingsSpend = 0;
  let debtSpend = 0;
  for (const g of grouped) {
    const amt = Number(g._sum.amount ?? 0);
    const grp = groupById.get(g.categoryId) ?? "WANTS";
    if (grp === "NEEDS") needs += amt;
    else if (grp === "WANTS") wants += amt;
    else savingsSpend += amt;
    if (debtCategoryIds.has(g.categoryId)) debtSpend += amt;
  }

  const totalExpense = needs + wants + savingsSpend;
  if (income.amount <= 0) {
    return { hasIncomeData: false as const, needs, wants, savingsSpend, debtSpend, totalExpense };
  }

  const savingsAmount = income.amount - needs - wants;
  return {
    hasIncomeData: true as const,
    incomeEstimated: income.estimated,
    income: income.amount,
    needs,
    wants,
    savingsSpend,
    debtSpend,
    savingsAmount,
    needsPct: (needs / income.amount) * 100,
    wantsPct: (wants / income.amount) * 100,
    savingsPct: (savingsAmount / income.amount) * 100,
    debtPct: (debtSpend / income.amount) * 100,
  };
}

async function getEmergencyFundCoverage(userId: string) {
  const [balancePoint] = (await getBalanceEvolution(userId, 1)).slice(-1);
  const last3 = await getMonthlyComparison(userId, 3);
  const avgMonthlyExpense = last3.reduce((s, m) => s + m.total, 0) / (last3.length || 1);
  const balance = balancePoint?.balance ?? 0;
  const coverageMonths = avgMonthlyExpense > 0 ? balance / avgMonthlyExpense : null;
  return { balance, avgMonthlyExpense, coverageMonths };
}

async function getSpendingTrends(userId: string) {
  const { start, end } = monthRange();
  const currentGrouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  const trends: { categoryId: string; name: string; current: number; average: number }[] = [];
  for (const g of currentGrouped) {
    const current = Number(g._sum.amount ?? 0);
    const history: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const s = new Date(start.getFullYear(), start.getMonth() - i, 1);
      const e = new Date(start.getFullYear(), start.getMonth() - i + 1, 1);
      const agg = await prisma.transaction.aggregate({
        where: { userId, type: "EXPENSE", categoryId: g.categoryId, date: { gte: s, lt: e } },
        _sum: { amount: true },
      });
      history.push(Number(agg._sum.amount ?? 0));
    }
    const average = history.reduce((a, b) => a + b, 0) / history.length;
    if (average > 0 && current > average * 1.2) {
      trends.push({ categoryId: g.categoryId, name: "", current, average });
    }
  }

  if (trends.length === 0) return [];
  const categories = await prisma.category.findMany({ where: { id: { in: trends.map((t) => t.categoryId) } } });
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  return trends
    .map((t) => ({ ...t, name: nameById.get(t.categoryId) ?? "esa categoría" }))
    .sort((a, b) => b.current / b.average - a.current / a.average)
    .slice(0, 2);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export async function getCoachReport(userId: string) {
  const [breakdown503020, emergency, trends, budgetGauges] = await Promise.all([
    get503020(userId),
    getEmergencyFundCoverage(userId),
    getSpendingTrends(userId),
    prisma.budget.findMany({ where: { userId } }).then(async (budgets) => {
      if (budgets.length === 0) return null;
      const { getBudgetGauges } = await import("./dashboard.service");
      return getBudgetGauges(userId);
    }),
  ]);

  const insights: CoachInsight[] = [];

  // --- 50/30/20 ---
  if (!breakdown503020.hasIncomeData) {
    insights.push({
      id: "no-income-data",
      type: "info",
      icon: "🧭",
      title: "Sumá tus ingresos",
      message:
        "Todavía no registré ingresos este mes. Cargalos (o completá un estimado en tu perfil) y te armo un panorama de en qué se te va la plata: necesidades, gustos y ahorro.",
    });
  } else {
    const { needsPct, wantsPct, savingsPct, income, incomeEstimated } = breakdown503020;
    const base = incomeEstimated ? " (estimado en base a lo que cargaste en tu perfil)" : "";

    if (needsPct > 65) {
      insights.push({
        id: "needs-critical",
        type: "critical",
        icon: "🏠",
        title: "Lo esencial se te está llevando casi todo",
        message: `Comida, transporte y salud ya son el ${Math.round(needsPct)}% de tus ingresos${base}. La referencia sana ronda el 50%. No es un reto, es una señal para repasar juntos qué se puede achicar sin resignar lo importante.`,
      });
    } else if (needsPct > 50) {
      insights.push({
        id: "needs-warning",
        type: "warning",
        icon: "🏠",
        title: "Lo esencial viene un poco alto",
        message: `Vas en ${Math.round(needsPct)}% de tus ingresos en necesidades básicas${base}, contra un ideal de 50%. Nada grave, pero vale la pena vigilarlo.`,
      });
    }

    if (wantsPct > 30) {
      insights.push({
        id: "wants-warning",
        type: wantsPct > 45 ? "critical" : "warning",
        icon: "🎉",
        title: "Los gustos se pasaron del 30%",
        message: `Este mes destinaste el ${Math.round(wantsPct)}% de tus ingresos a gustos y entretenimiento${base} (ideal: 30%). Disfrutar está bien, solo chequeemos que no se coma el ahorro.`,
      });
    }

    if (savingsPct >= 20) {
      insights.push({
        id: "savings-good",
        type: "positive",
        icon: "🌱",
        title: "Estás cumpliendo la regla del 20% de ahorro",
        message: `Destinaste (o te quedó disponible) el ${Math.round(savingsPct)}% de tus ingresos para ahorro o deudas${base}. ¡Así se construye tranquilidad financiera!`,
      });
    } else if (savingsPct >= 0) {
      insights.push({
        id: "savings-low",
        type: "warning",
        icon: "🌱",
        title: "El ahorro viene corto este mes",
        message: `Estás ahorrando el ${Math.round(savingsPct)}% de tus ingresos${base}; los coaches financieros recomiendan apuntar al 20%. ¿Revisamos algún gasto de "gustos" para correr el número un poco?`,
      });
    } else {
      insights.push({
        id: "savings-negative",
        type: "critical",
        icon: "⚠️",
        title: "Este mes gastaste más de lo que entró",
        message: `Tus gastos superaron tus ingresos en ${money(Math.abs(breakdown503020.savingsAmount))}${base}. Che, pasa, no te juzgues — repasemos juntos qué movió la aguja este mes.`,
      });
    }

    if (breakdown503020.debtPct > 20) {
      insights.push({
        id: "debt-high",
        type: "critical",
        icon: "💳",
        title: "La deuda se está llevando una porción grande",
        message: `El ${Math.round(breakdown503020.debtPct)}% de tus ingresos se fue en pagar deudas. Cuando supera el 20% conviene priorizarlo: probá el método "avalancha" (pagar primero la deuda con mayor tasa de interés, poniendo el mínimo en el resto).`,
      });
    } else if (breakdown503020.debtPct > 10) {
      insights.push({
        id: "debt-medium",
        type: "warning",
        icon: "💳",
        title: "Tenés deuda activa este mes",
        message: `Destinaste el ${Math.round(breakdown503020.debtPct)}% de tus ingresos a deudas. Vas bien, solo no pierdas de vista el objetivo de bajarla mes a mes.`,
      });
    }
  }

  // --- Emergency fund ---
  if (emergency.coverageMonths !== null) {
    const months = emergency.coverageMonths;
    if (months < 3) {
      insights.push({
        id: "emergency-low",
        type: "warning",
        icon: "🛟",
        title: "Tu colchón de emergencia todavía es chico",
        message: `Con tu saldo actual cubrirías ${months.toFixed(1)} mes${months >= 2 ? "es" : ""} de gastos si pasara un imprevisto. Los coaches financieros recomiendan entre 3 y 6 meses. ¿Creamos una meta de fondo de emergencia?`,
      });
    } else if (months < 6) {
      insights.push({
        id: "emergency-ok",
        type: "info",
        icon: "🛟",
        title: "Vas bien con tu fondo de emergencia",
        message: `Tenés ${months.toFixed(1)} meses de gastos cubiertos. Con un poco más llegás a la zona ideal de 6 meses.`,
      });
    } else {
      insights.push({
        id: "emergency-great",
        type: "positive",
        icon: "🛟",
        title: "Tu fondo de emergencia está sólido",
        message: `Tenés ${months.toFixed(1)} meses de gastos cubiertos. Eso te da mucha tranquilidad ante cualquier imprevisto. 💪`,
      });
    }
  }

  // --- Trends ---
  for (const t of trends) {
    insights.push({
      id: `trend-${t.categoryId}`,
      type: "warning",
      icon: "📈",
      title: `${t.name} viene en aumento`,
      message: `Este mes gastaste ${money(t.current)} en ${t.name.toLowerCase()}, contra un promedio de ${money(t.average)} en los últimos meses. ¿Le pegamos una repasada junto para ver si conviene optimizarlo?`,
    });
  }

  // --- Budget adherence used only for the health score, not duplicated as insights (dashboard already shows gauges) ---
  const adherenceRatio =
    budgetGauges && budgetGauges.length > 0
      ? budgetGauges.filter((g) => g.status !== "red").length / budgetGauges.length
      : 0.7;

  const savingsComponent = breakdown503020.hasIncomeData
    ? clamp(breakdown503020.savingsPct / 20, 0, 1) * 40
    : 20;
  const emergencyComponent = emergency.coverageMonths !== null ? clamp(emergency.coverageMonths / 6, 0, 1) * 30 : 15;
  const budgetComponent = adherenceRatio * 20;
  const debtComponent = breakdown503020.hasIncomeData
    ? clamp(1 - breakdown503020.debtPct / 30, 0, 1) * 10
    : 10;

  const score = Math.round(clamp(savingsComponent + emergencyComponent + budgetComponent + debtComponent, 0, 100));
  const scoreStatus = score >= 75 ? "green" : score >= 50 ? "yellow" : "red";
  const scoreLabel =
    score >= 75 ? "Tu salud financiera está sólida" : score >= 50 ? "Vas bien, con margen para mejorar" : "Hay puntos para reforzar, vamos paso a paso";

  const severityOrder = { critical: 0, warning: 1, info: 2, positive: 3 };
  insights.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

  return { score, scoreStatus, scoreLabel, insights };
}
