import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "hb6_dash";
const SESSION_TTL = 60 * 60 * 12; // 12 hours

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET is missing or too short (need 32+ chars)");
  }
  return s;
}

export function signSession(): { token: string; maxAgeMs: number } {
  const token = jwt.sign({ role: "dashboard" }, secret(), {
    expiresIn: SESSION_TTL,
  });
  return { token, maxAgeMs: SESSION_TTL * 1000 };
}

export function requireDashboardAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    if (req.accepts("html")) return res.redirect("/dashboard/login");
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    jwt.verify(token, secret());
    return next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    if (req.accepts("html")) return res.redirect("/dashboard/login");
    return res.status(401).json({ error: "unauthorized" });
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
