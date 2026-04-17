# HB 6 Impact Survey — Violence-Free Schools Alliance

Anonymous survey platform for collecting Texas educator perceptions of HB 6
(89th Legislature, 2025) implementation, with a live password-protected
dashboard and an optional newsletter signup for VFSA.

## What's in the box

- **`web/`** — Astro + Tailwind static site. Holds the landing page,
  teacher survey, administrator survey, newsletter signup, and a thank-you
  page with a donate link to your GoFundMe. Deploys to **Netlify**.
- **`api/`** — Node 20 + Express + Prisma + Postgres. Handles survey
  submissions, newsletter signups, and serves a password-protected
  dashboard with real-time stats and CSV export. Runs as a **Docker
  container on your Hostinger VPS**.
- **`docker-compose.yml`** — Brings up Postgres, the API, and a Caddy
  reverse proxy with automatic TLS.
- **`Caddyfile`** — Reverse proxy config for the API + dashboard
  subdomains.
- **`netlify.toml`** — Netlify build config for the frontend.

Two subdomains serve this project:

| Subdomain                               | What it serves                   | Where it runs |
|-----------------------------------------|----------------------------------|---------------|
| `survey.violencefreeschools.org`        | Public survey pages (static)     | Netlify       |
| `api.violencefreeschools.org`           | Survey + newsletter submissions  | Hostinger VPS |
| `dashboard.violencefreeschools.org`     | Password-protected dashboard     | Hostinger VPS |

Anonymity is enforced in the data model: survey responses and newsletter
signups live in two separate Postgres tables with no foreign key between
them, so the data cannot be correlated even by the admin.

---

## Architecture at a glance

```
┌──────────────────────────┐           ┌──────────────────────────────────┐
│ Respondent (phone/laptop)│           │ You (Danny, on the dashboard)     │
└────────────┬─────────────┘           └─────────────────┬────────────────┘
             │ HTTPS                                      │ HTTPS
             ▼                                            ▼
 ┌──────────────────────────┐             ┌──────────────────────────────┐
 │ survey.violencefreeschools│             │ dashboard.violencefreeschools│
 │        .org (Netlify)     │             │        .org (Caddy on VPS)   │
 └────────────┬──────────────┘             └──────────────┬───────────────┘
              │ POST /submit, POST /newsletter              │ (cookie auth)
              ▼                                            ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │            api.violencefreeschools.org (Caddy → api container)         │
 │     Express + Prisma + Zod validation + rate limits + CORS allow-list  │
 └───────────────────────────────┬────────────────────────────────────────┘
                                 ▼
                        ┌─────────────────┐
                        │  Postgres 16    │
                        │  (pgdata vol.)  │
                        └─────────────────┘
```

---

## Local development

Requirements: **Node 20**, **Docker Desktop**, and (optional) `pnpm` or
`npm`.

```bash
# 1. Clone and install
cd api && npm install && cd ..
cd web && npm install && cd ..

# 2. Start Postgres alone for local dev
cp .env.example .env
docker compose up -d db

# 3. Push schema to the local DB
cd api
DATABASE_URL="postgresql://hb6:CHANGE_ME_STRONG_PASSWORD@localhost:5432/hb6?schema=public" \
  npx prisma db push

# 4. Run the API
DATABASE_URL="postgresql://hb6:CHANGE_ME_STRONG_PASSWORD@localhost:5432/hb6?schema=public" \
DASHBOARD_PASSWORD=letmein \
SESSION_SECRET=this_is_at_least_32_characters_long_please \
CORS_ORIGINS="http://localhost:4321" \
  npm run dev

# 5. In another shell, run the web frontend
cd web
PUBLIC_API_URL=http://localhost:4000 npm run dev
# → http://localhost:4321
```

The dashboard will be at `http://localhost:4000/dashboard/login` (password
= whatever you set as `DASHBOARD_PASSWORD`).

---

## Production deployment

There are two moving pieces: the Netlify frontend and the VPS Docker
stack. Ship them in either order — they don't depend on each other at
deploy time.

### 1 · Push to GitHub

```bash
cd "Claude - Educator Association/hb6-survey"
git init
git add .
git commit -m "Initial HB 6 survey platform"
git branch -M main
git remote add origin git@github.com:YOUR_USER/hb6-survey.git
git push -u origin main
```

### 2 · Hostinger VPS (Docker stack)

On the VPS, install Docker if it's not already present:

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
```

Point DNS so these subdomains hit the VPS's public IP:

- `api.violencefreeschools.org` → A record → VPS IP
- `dashboard.violencefreeschools.org` → A record → VPS IP

Then clone the repo and configure:

```bash
cd /opt
git clone https://github.com/YOUR_USER/hb6-survey.git
cd hb6-survey
cp .env.example .env
nano .env   # fill in real values — especially:
            #   POSTGRES_PASSWORD     (pick something strong)
            #   DATABASE_URL          (must use that same password)
            #   DASHBOARD_PASSWORD    (your dashboard login)
            #   SESSION_SECRET        (>=32 random chars; `openssl rand -hex 32`)
            #   CORS_ORIGINS          = https://survey.violencefreeschools.org
            #   API_DOMAIN            = api.violencefreeschools.org
            #   DASHBOARD_DOMAIN      = dashboard.violencefreeschools.org
            #   ACME_EMAIL            = your email for Let's Encrypt notices
            #   DONATE_URL            = https://www.gofundme.com/f/help-vfsa-...
```

Generate a secret quickly:

```bash
openssl rand -hex 32   # copy into SESSION_SECRET
```

Build and launch:

```bash
docker compose up -d --build
docker compose logs -f api
```

On first boot the API runs `prisma db push`, which creates the two
tables. Subsequent boots are no-ops. Caddy will fetch TLS certificates
on first request to each domain — you'll see those in the `caddy` logs
within ~30s after DNS propagates.

Health check:

```bash
curl https://api.violencefreeschools.org/health
# { "ok": true, "now": "..." }
```

Dashboard: visit `https://dashboard.violencefreeschools.org/dashboard/login`
and enter `DASHBOARD_PASSWORD`.

### 3 · Netlify (survey frontend)

1. Log into Netlify → **Add new site → Import an existing project** →
   select the GitHub repo.
2. Netlify auto-detects `netlify.toml`. Confirm:
   - **Base directory:** `web`
   - **Build command:** `npm ci && npm run build`
   - **Publish directory:** `web/dist`
3. Under **Site settings → Environment variables**, add:
   - `PUBLIC_API_URL` = `https://api.violencefreeschools.org`
   - `PUBLIC_DONATE_URL` = `https://www.gofundme.com/f/help-vfsa-make-schools-violencefree-zones`
4. **Domain management** → add custom domain
   `survey.violencefreeschools.org` and follow Netlify's DNS
   instructions (usually a CNAME to Netlify's edge).
5. Trigger a deploy. The site is live once Netlify reports success.

### 4 · Smoke test

- Open `https://survey.violencefreeschools.org` → click **Start teacher
  survey** → complete it.
- On your dashboard you should see the total increase from 0 → 1 within
  5 seconds (the dashboard polls every 5s).
- Back on the thank-you page, submit the newsletter form → the
  "Newsletter signups" KPI should tick up.

---

## Ongoing maintenance

### Deploy a code change

```bash
# Frontend — Netlify rebuilds automatically on push.
git push

# Backend — SSH into VPS:
cd /opt/hb6-survey
git pull
docker compose up -d --build api
```

### Backup the database

```bash
# On the VPS:
docker compose exec db pg_dump -U hb6 hb6 \
  | gzip > "backups/hb6-$(date +%F).sql.gz"
```

Move the backup off-box with `rsync` or Hostinger's snapshot feature.

### Rotate the dashboard password

Edit `.env`, change `DASHBOARD_PASSWORD`, then:

```bash
docker compose up -d --build api
```

Active cookies remain valid for up to 12 hours. To force everyone out
immediately, also rotate `SESSION_SECRET`.

### Edit survey questions

Two files must stay in sync:

- `web/src/lib/questions.ts` (what the user sees)
- `api/src/lib/questions.ts` (what the server validates)

IDs and option `value` strings must match exactly. Labels only matter on
the frontend file.

After editing, `git push` redeploys the frontend via Netlify. For the
backend: `docker compose up -d --build api` on the VPS.

### Export all data

- From the dashboard: **Download CSV** (respects current filters).
- Or directly: `GET https://dashboard.violencefreeschools.org/dashboard/api/export.csv`
  with a valid dashboard cookie.

---

## Privacy & data model

- `Submission` has no name, email, IP, or timestamp of survey page load
  — only what the user explicitly selected plus a server-side
  `createdAt`.
- `NewsletterSignup` stores only the email and `createdAt`.
- There is **no foreign key** between the two tables and no shared
  identifier. Danny cannot correlate any email with any response, and
  neither can a compromised server or database dump.
- Caddy logs do record IP addresses at the reverse-proxy level for abuse
  detection. Configure log rotation or disable request logs in the
  `Caddyfile` if that's a concern.

---

## Troubleshooting

**Dashboard redirects to /login even after entering the correct
password.** Check that `SESSION_SECRET` is set and at least 32 chars,
and that you're visiting the dashboard over HTTPS (the cookie is
`secure: true` in production).

**Submissions from Netlify return CORS errors.** Ensure your Netlify
origin is listed in `CORS_ORIGINS` on the VPS `.env`, then restart:
`docker compose up -d api`.

**TLS not issuing.** Confirm DNS A records for both subdomains point at
the VPS, and that ports 80 + 443 are open. `docker compose logs caddy`
will show Let's Encrypt progress.

**Prisma `P1001: Can't reach database`.** The API starts before the DB
finishes warming. The compose healthcheck should prevent this, but if
you see it, just `docker compose restart api`.

---

## License / credits

This repo was built for the Violence-Free Schools Alliance. Use it, fork
it, adapt it for other advocacy research. Attribution appreciated but
not required.
