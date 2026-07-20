import type { User } from "@prisma/client";

export const FREE_LIMITS = {
  maxAccounts: 1,
  maxActiveGoals: 1,
  customCategories: false,
  historicalMonths: 1,
};

export function isPremiumActive(user: Pick<User, "plan" | "premiumUntil" | "premiumLifetime">): boolean {
  if (user.plan !== "PREMIUM") return false;
  if (user.premiumLifetime) return true;
  if (!user.premiumUntil) return false;
  return user.premiumUntil.getTime() > Date.now();
}
