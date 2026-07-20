import bcrypt from "bcryptjs";
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { verifyAppleIdentityToken } from "../lib/appleAuth";
import { env } from "../lib/env";
import { signToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { DEFAULT_CATEGORIES } from "../utils/defaultCategories";
import { toUserDto } from "../utils/userDto";

export const authRouter = Router();

const googleClient = new OAuth2Client(env.googleClientId);

async function createStarterAccount(userId: string) {
  await prisma.account.create({
    data: { userId, name: "Efectivo", type: "CASH", icon: "💵", color: "#5B4FE9" },
  });
}

async function promoteAdminIfMatches(userId: string, email: string) {
  if (env.adminEmail && email.toLowerCase() === env.adminEmail.toLowerCase()) {
    await prisma.user.update({ where: { id: userId }, data: { isAdmin: true } });
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(1),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
  }
  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Ya existe una cuenta con ese email" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, authProvider: "EMAIL" },
  });
  await createStarterAccount(user.id);
  await promoteAdminIfMatches(user.id, user.email);

  const token = signToken({ userId: user.id });
  res.status(201).json({ token, user: toUserDto(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return res.status(401).json({ error: "Email o contraseña incorrectos" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Email o contraseña incorrectos" });

  const token = signToken({ userId: user.id });
  res.json({ token, user: toUserDto(user) });
});

authRouter.post("/google", async (req, res) => {
  const idToken = req.body?.idToken as string | undefined;
  if (!idToken) return res.status(400).json({ error: "Falta idToken" });
  if (!env.googleClientId) return res.status(500).json({ error: "Google Sign-In no está configurado en el servidor" });

  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) return res.status(401).json({ error: "Token de Google inválido" });

    let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: payload.email } });
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId: payload.sub } });
      } else {
        user = await prisma.user.create({
          data: {
            email: payload.email,
            name: payload.name ?? payload.email.split("@")[0],
            googleId: payload.sub,
            authProvider: "GOOGLE",
          },
        });
        await createStarterAccount(user.id);
        await promoteAdminIfMatches(user.id, user.email);
      }
    }
    const token = signToken({ userId: user.id });
    res.json({ token, user: toUserDto(user) });
  } catch (err) {
    res.status(401).json({ error: "No se pudo verificar el token de Google" });
  }
});

authRouter.post("/apple", async (req, res) => {
  const { identityToken, name } = req.body as { identityToken?: string; name?: string };
  if (!identityToken) return res.status(400).json({ error: "Falta identityToken" });

  try {
    const claims = await verifyAppleIdentityToken(identityToken);
    let user = await prisma.user.findUnique({ where: { appleId: claims.sub } });
    if (!user) {
      const email = claims.email ?? `${claims.sub}@privaterelay.appleid.com`;
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { appleId: claims.sub } });
      } else {
        user = await prisma.user.create({
          data: { email, name: name ?? "Usuario", appleId: claims.sub, authProvider: "APPLE" },
        });
        await createStarterAccount(user.id);
        await promoteAdminIfMatches(user.id, user.email);
      }
    }
    const token = signToken({ userId: user.id });
    res.json({ token, user: toUserDto(user) });
  } catch (err) {
    res.status(401).json({ error: "No se pudo verificar el token de Apple" });
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({ user: toUserDto(user) });
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatarEmoji: z.string().min(1).max(4).optional(),
  estimatedMonthlyIncome: z.number().nonnegative().optional(),
});

authRouter.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const user = await prisma.user.update({ where: { id: req.userId }, data: parsed.data });
  res.json({ user: toUserDto(user) });
});

authRouter.get("/default-categories", async (_req, res) => {
  res.json({ categories: DEFAULT_CATEGORIES });
});
