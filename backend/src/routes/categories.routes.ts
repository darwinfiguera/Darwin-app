import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { isPremiumActive } from "../utils/plan";

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

categoriesRouter.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId: req.userId }] },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  res.json({ categories });
});

const createSchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  kind: z.enum(["EXPENSE", "INCOME", "BOTH"]).default("EXPENSE"),
});

categoriesRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || !isPremiumActive(user)) {
    return res.status(403).json({
      error: "Crear categorías personalizadas es una función Premium.",
      code: "PLAN_LIMIT",
    });
  }

  const category = await prisma.category.create({
    data: { ...parsed.data, userId: req.userId!, isDefault: false },
  });
  res.status(201).json({ category });
});

categoriesRouter.delete("/:id", async (req, res) => {
  const category = await prisma.category.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!category) return res.status(404).json({ error: "Categoría no encontrada" });
  await prisma.category.delete({ where: { id: category.id } });
  res.status(204).end();
});
