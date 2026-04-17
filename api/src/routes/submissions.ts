import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { buildSchema, getSurveyDef } from "../lib/validate.js";

export const submissionsRouter = Router();

// Allow up to 30 submissions per 10 minutes per IP.
// Legitimate users submit once; this just prevents abuse.
const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

submissionsRouter.post("/submit/:role", submitLimiter, async (req: Request, res: Response) => {
  const role = req.params.role;
  const def = getSurveyDef(role);
  if (!def) return res.status(404).json({ error: "unknown_survey" });

  const schema = buildSchema(def);
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "validation_error",
      issues: parsed.data === undefined ? parsed.error.flatten() : undefined,
    });
  }

  const answers = parsed.data.answers as Record<string, unknown>;
  const region = typeof answers.region === "string" ? (answers.region as string) : null;

  try {
    await prisma.submission.create({
      data: {
        role: role as "teacher" | "administrator",
        region,
        answers: answers as any,
      },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("submission error", err);
    res.status(500).json({ error: "server_error" });
  }
});
