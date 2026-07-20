import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { durationToDate, generateRedemptionCode } from "../utils/codeGenerator";

export const codesRouter = Router();
codesRouter.use(requireAuth);

// ---- Admin: generate & list ----
const createSchema = z.object({
  duration: z.enum(["DAYS_30", "MONTHS_6", "LIFETIME"]),
  note: z.string().optional(),
  count: z.number().int().min(1).max(100).default(1),
});

codesRouter.post("/", requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const { duration, note, count } = parsed.data;

  const codes = await Promise.all(
    Array.from({ length: count }).map(() =>
      prisma.redemptionCode.create({
        data: { code: generateRedemptionCode(), duration, note },
      }),
    ),
  );
  res.status(201).json({ codes });
});

codesRouter.get("/", requireAdmin, async (req, res) => {
  const codes = await prisma.redemptionCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { usedByUser: { select: { id: true, email: true, name: true } } },
    take: 200,
  });
  res.json({ codes });
});

// ---- User: redeem ----
const redeemSchema = z.object({ code: z.string().min(4) });

codesRouter.post("/redeem", async (req, res) => {
  const parsed = redeemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Ingresá un código válido" });
  const normalized = parsed.data.code.trim().toUpperCase();

  const code = await prisma.redemptionCode.findUnique({ where: { code: normalized } });
  if (!code) return res.status(404).json({ error: "Ese código no existe. Revisalo y probá de nuevo." });
  if (code.used) return res.status(409).json({ error: "Ese código ya fue usado." });

  const currentUser = await prisma.user.findUnique({ where: { id: req.userId } });
  const { until, lifetime } = durationToDate(code.duration, currentUser?.premiumUntil ?? undefined);

  const [, updatedUser] = await prisma.$transaction([
    prisma.redemptionCode.update({
      where: { id: code.id },
      data: { used: true, usedByUserId: req.userId, usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: {
        plan: "PREMIUM",
        premiumLifetime: lifetime || currentUser?.premiumLifetime || false,
        premiumUntil: lifetime ? null : until,
      },
    }),
  ]);

  res.json({
    message: "¡Listo! Premium activado 🎉",
    plan: updatedUser.plan,
    premiumUntil: updatedUser.premiumUntil,
    premiumLifetime: updatedUser.premiumLifetime,
  });
});
