import { Router } from "express";
import { getCoachReport } from "../services/coach.service";
import { requireAuth } from "../middleware/auth";

export const coachRouter = Router();
coachRouter.use(requireAuth);

coachRouter.get("/report", async (req, res) => {
  const report = await getCoachReport(req.userId!);
  res.json(report);
});
