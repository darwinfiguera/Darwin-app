import type { User } from "@prisma/client";
import { isPremiumActive } from "./plan";

export function toUserDto(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarEmoji: user.avatarEmoji,
    isAdmin: user.isAdmin,
    plan: user.plan,
    premium: isPremiumActive(user),
    premiumUntil: user.premiumUntil,
    premiumLifetime: user.premiumLifetime,
    estimatedMonthlyIncome: user.estimatedMonthlyIncome ? Number(user.estimatedMonthlyIncome) : null,
    createdAt: user.createdAt,
  };
}
