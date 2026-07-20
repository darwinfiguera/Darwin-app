import cors from "cors";
import express from "express";
import path from "node:path";
import { env } from "./lib/env";
import { authRouter } from "./routes/auth.routes";
import { accountsRouter } from "./routes/accounts.routes";
import { categoriesRouter } from "./routes/categories.routes";
import { transactionsRouter } from "./routes/transactions.routes";
import { budgetsRouter } from "./routes/budgets.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { goalsRouter } from "./routes/goals.routes";
import { coachRouter } from "./routes/coach.routes";
import { billingRouter } from "./routes/billing.routes";
import { codesRouter } from "./routes/codes.routes";

const app = express();

app.use(cors());

// Stripe needs the raw request body to verify the webhook signature, so that
// one route is excluded here and parsed with express.raw() in billing.routes.ts.
app.use((req, res, next) => {
  if (req.path === "/api/billing/webhook") return next();
  express.json({ limit: "2mb" })(req, res, next);
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/admin", (_req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/coach", coachRouter);
app.use("/api/billing", billingRouter);
app.use("/api/codes", codesRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(env.port, () => {
  console.log(`MisCuentas backend escuchando en http://localhost:${env.port}`);
});
