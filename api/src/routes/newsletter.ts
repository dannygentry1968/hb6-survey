import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import { newsletterSchema } from "../lib/validate.js";

export const newsletterRouter = Router();

const newsletterLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

newsletterRouter.post("/newsletter", newsletterLimiter, async (req: Request, res: Response) => {
  const parsed = newsletterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_email" });

  try {
    await prisma.newsletterSignup.upsert({
      where: { email: parsed.data.email },
      update: {}, // idempotent — no PII update needed on duplicate
      create: { email: parsed.data.email },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("newsletter error", err);
    res.status(500).json({ error: "server_error" });
  }
});
