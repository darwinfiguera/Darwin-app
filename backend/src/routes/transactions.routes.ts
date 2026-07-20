import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

transactionsRouter.get("/", async (req, res) => {
  const { accountId, categoryId, from, to, limit } = req.query as Record<string, string | undefined>;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.userId,
      ...(accountId ? { accountId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
    take: limit ? Math.min(Number(limit), 200) : 100,
  });
  res.json({ transactions });
});

const createSchema = z.object({
  accountId: z.string(),
  categoryId: z.string(),
  type: z.enum(["EXPENSE", "INCOME"]),
  amount: z.number().positive(),
  note: z.string().optional(),
  date: z.string().datetime().optional(),
});

transactionsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const { accountId, categoryId, type, amount, note, date } = parsed.data;

  const account = await prisma.account.findFirst({ where: { id: accountId, userId: req.userId } });
  if (!account) return res.status(404).json({ error: "Cuenta no encontrada" });

  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId: null }, { userId: req.userId }] },
  });
  if (!category) return res.status(404).json({ error: "Categoría no encontrada" });

  const transaction = await prisma.transaction.create({
    data: {
      userId: req.userId!,
      accountId,
      categoryId,
      type,
      amount,
      note,
      date: date ? new Date(date) : new Date(),
    },
    include: { category: true, account: true },
  });
  res.status(201).json({ transaction });
});

const updateSchema = createSchema.partial();

transactionsRouter.patch("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const existing = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Movimiento no encontrado" });

  const { date, ...rest } = parsed.data;
  const transaction = await prisma.transaction.update({
    where: { id: existing.id },
    data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    include: { category: true, account: true },
  });
  res.json({ transaction });
});

transactionsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Movimiento no encontrado" });
  await prisma.transaction.delete({ where: { id: existing.id } });
  res.status(204).end();
});
