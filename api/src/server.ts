import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { submissionsRouter } from "./routes/submissions.js";
import { newsletterRouter }   from "./routes/newsletter.js";
import { dashboardRouter }    from "./routes/dashboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Trust the Caddy reverse proxy so rate-limit sees real IPs.
app.set("trust proxy", 1);

// --- Security headers ---
app.use(
  helmet({
    // The dashboard uses inline script/style for simplicity; CSP is relaxed
    // only for the /dashboard route. Public routes stay locked down.
    contentSecurityPolicy: false,
  })
);

// --- CORS ---
const origins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      // Same-origin requests (dashboard) have no Origin header → allow.
      if (!origin) return cb(null, true);
      if (origins.length === 0 || origins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// --- Static dashboard assets (login page + dashboard shell) ---
app.use("/dashboard/static", express.static(path.join(__dirname, "public/dashboard")));

// --- Health check for Docker / monitoring ---
app.get("/health", (_req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// --- Public routes ---
app.use(submissionsRouter);
app.use(newsletterRouter);

// --- Admin dashboard (protected) ---
app.use(dashboardRouter);

// --- Root landing for API domain ---
app.get("/", (_req, res) => {
  res.type("text/plain").send(
    "HB 6 Survey API. See https://survey.violencefreeschools.org for the survey itself."
  );
});

// --- 404 ---
app.use((_req, res) => res.status(404).json({ error: "not_found" }));

// --- Error handler ---
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: "server_error" });
});

const port = parseInt(process.env.PORT ?? "4000", 10);
app.listen(port, () => {
  console.log(`HB 6 API listening on :${port}`);
});
