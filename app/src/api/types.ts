export interface User {
  id: string;
  email: string;
  name: string;
  avatarEmoji: string;
  isAdmin: boolean;
  plan: "FREE" | "PREMIUM";
  premium: boolean;
  premiumUntil: string | null;
  premiumLifetime: boolean;
  estimatedMonthlyIncome: number | null;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: "CASH" | "CARD" | "BANK";
  icon: string;
  color: string;
  archived: boolean;
}

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon: string;
  color: string;
  kind: "EXPENSE" | "INCOME" | "BOTH";
  group: "NEEDS" | "WANTS" | "SAVINGS";
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  note: string | null;
  date: string;
  category?: Category;
  account?: Account;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  category: Category;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  status: "ACTIVE" | "COMPLETED";
  percent: number;
  nudgeMessage: string | null;
  locked?: boolean;
}

export interface BudgetGauge {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  limit: number;
  percent: number;
  status: "green" | "yellow" | "red";
  message: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
}

export interface CoachInsight {
  id: string;
  type: "positive" | "info" | "warning" | "critical";
  icon: string;
  title: string;
  message: string;
}

export interface DashboardSummary {
  monthIncome: number;
  monthExpense: number;
  balance: number;
  categoryBreakdown: CategoryBreakdownItem[];
  budgetGauges: BudgetGauge[];
  coach: {
    score: number;
    scoreStatus: "green" | "yellow" | "red";
    scoreLabel: string;
    topInsights: CoachInsight[];
  };
}

export interface MonthlyComparisonPoint {
  key: string;
  label: string;
  total: number;
  isCurrent: boolean;
}

export interface BalancePoint {
  key: string;
  label: string;
  balance: number;
}
