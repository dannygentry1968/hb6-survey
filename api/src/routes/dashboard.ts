import { Router, type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma.js";
import {
  requireDashboardAuth,
  signSession,
  SESSION_COOKIE,
} from "../middleware/auth.js";
import { surveys, flattenQuestions } from "../lib/questions.js";

export const dashboardRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public/dashboard");

// -------------------------- auth -----------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

dashboardRouter.get("/dashboard/login", (_req, res) => {
  res.sendFile(path.join(publicDir, "login.html"));
});

dashboardRouter.post("/dashboard/login", loginLimiter, (req: Request, res: Response) => {
  const { password } = req.body ?? {};
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return res.status(500).json({ error: "dashboard_not_configured" });
  if (typeof password !== "string" || password !== expected) {
    return res.status(401).json({ error: "invalid_password" });
  }
  const { token, maxAgeMs } = signSession();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeMs,
    path: "/",
  });
  res.json({ ok: true });
});

dashboardRouter.post("/dashboard/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

// --------------------- protected pages -----------------------
dashboardRouter.get("/dashboard", requireDashboardAuth, (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// --------------------- stats API -----------------------------
type StatsParams = {
  role?: "teacher" | "administrator" | "both";
  region?: string | null;
  since?: Date | null;
  until?: Date | null;
};

function parseFilters(req: Request): StatsParams {
  const role = req.query.role as StatsParams["role"];
  const region = typeof req.query.region === "string" && req.query.region ? req.query.region : null;
  const since = typeof req.query.since === "string" && req.query.since
    ? new Date(req.query.since) : null;
  const until = typeof req.query.until === "string" && req.query.until
    ? new Date(req.query.until) : null;
  return { role, region, since, until };
}

function buildWhere(f: StatsParams) {
  const where: any = {};
  if (f.role && f.role !== "both") where.role = f.role;
  if (f.region) where.region = f.region;
  if (f.since || f.until) {
    where.createdAt = {};
    if (f.since) where.createdAt.gte = f.since;
    if (f.until) where.createdAt.lte = f.until;
  }
  return where;
}

dashboardRouter.get("/dashboard/api/stats", requireDashboardAuth, async (req, res) => {
  const filters = parseFilters(req);
  const where = buildWhere(filters);

  type DayRow = { day: Date; count: number | bigint };

  const [totals, byRole, byRegion, byDay, newsletterCount, last5] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.groupBy({ by: ["role"], where, _count: { _all: true } }),
    prisma.submission.groupBy({ by: ["region"], where, _count: { _all: true } }),
    prisma.$queryRawUnsafe<DayRow[]>(
      `SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
       FROM "Submission"
       WHERE ${whereSql(filters)}
       GROUP BY 1
       ORDER BY 1 ASC
       LIMIT 365`
    ),
    prisma.newsletterSignup.count(),
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, role: true, region: true, createdAt: true },
    }),
  ]);

  // Compute "highlight" stats per-survey: the % split for each Likert / single question.
  const distributions: Record<string, Record<string, Record<string, number>>> = {
    teacher: {},
    administrator: {},
  };
  for (const role of ["teacher", "administrator"] as const) {
    if (filters.role && filters.role !== role && filters.role !== "both") continue;
    const subs = await prisma.submission.findMany({
      where: { ...where, role },
      select: { answers: true },
      take: 50000, // Upper bound — plenty of headroom for this survey.
    });
    const def = surveys[role];
    for (const q of flattenQuestions(def)) {
      if (q.type !== "single" && q.type !== "likert5" && q.type !== "multi") continue;
      const bucket: Record<string, number> = {};
      for (const s of subs) {
        const v = (s.answers as any)?.[q.id];
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          for (const x of v) bucket[String(x)] = (bucket[String(x)] ?? 0) + 1;
        } else {
          bucket[String(v)] = (bucket[String(v)] ?? 0) + 1;
        }
      }
      distributions[role][q.id] = bucket;
    }
  }

  res.json({
    totals,
    byRole: Object.fromEntries(
      byRole.map((r: { role: string; _count: { _all: number } }) => [r.role, r._count._all])
    ),
    byRegion: Object.fromEntries(
      byRegion.map((r: { region: string | null; _count: { _all: number } }) => [
        r.region ?? "unknown",
        r._count._all,
      ])
    ),
    byDay: byDay.map((r: DayRow) => ({ day: r.day, count: Number(r.count) })),
    newsletterCount,
    recent: last5,
    distributions,
  });
});

function whereSql(f: StatsParams): string {
  // Build a safe WHERE clause for the raw SQL above.
  const parts: string[] = ["1=1"];
  if (f.role && f.role !== "both") parts.push(`role = '${f.role === "teacher" ? "teacher" : "administrator"}'`);
  if (f.region) parts.push(`region = '${f.region.replace(/'/g, "''")}'`);
  if (f.since) parts.push(`"createdAt" >= '${f.since.toISOString()}'`);
  if (f.until) parts.push(`"createdAt" <= '${f.until.toISOString()}'`);
  return parts.join(" AND ");
}

// --------------------- CSV export ----------------------------
dashboardRouter.get("/dashboard/api/export.csv", requireDashboardAuth, async (req, res) => {
  const filters = parseFilters(req);
  const where = buildWhere(filters);
  const rows = await prisma.submission.findMany({ where, orderBy: { createdAt: "asc" } });

  // Header: union of all answer keys across rows (safe for evolving schemas).
  const keys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r.answers as any)) keys.add(k);
  const header = ["id", "role", "region", "createdAt", ...Array.from(keys)];

  function esc(v: unknown): string {
    if (v === null || v === undefined) return "";
    const s = Array.isArray(v) ? v.join("|") : String(v);
    if (s.includes(",") || s.includes("\n") || s.includes("\"")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const lines = [header.join(",")];
  for (const r of rows) {
    const answers = r.answers as Record<string, unknown>;
    const line = [
      r.id,
      r.role,
      r.region ?? "",
      r.createdAt.toISOString(),
      ...Array.from(keys).map((k) => esc(answers[k])),
    ].map(esc).join(",");
    lines.push(line);
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="hb6-submissions-${Date.now()}.csv"`);
  res.send(lines.join("\n"));
});
