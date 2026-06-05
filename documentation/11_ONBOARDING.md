# 11 — Onboarding

> **Last Updated:** 2026-06-05

---

## Prerequisites

- **Node.js** 22+ (recommended)
- **npm** (comes with Node.js)
- **PostgreSQL** 16+ (local install or Docker) — OR a Supabase project
- **Redis** 7+ (optional for local dev — rate limiting falls open if missing)
- **Git**

Optional for full data sync:
- API keys for Congress.gov, FEC, Google Civic, LegiScan, CourtListener, Anthropic, Resend

---

## Clone & Install

```bash
# Clone the repository
git clone <repo-url>
cd InformedVoter

# Install dependencies (triggers prisma generate via postinstall)
npm install
```

---

## Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and fill in required values:
# - DATABASE_URL (local: postgresql://postgres:password@localhost:5432/informedvoter)
# - ANTHROPIC_API_KEY (for AI features)
# - NEXT_PUBLIC_BASE_URL (http://localhost:3000)
# Optional: REDIS_URL, CRON_SECRET, data API keys
```

---

## Database Setup

### Option A: Local PostgreSQL

```bash
# Ensure PostgreSQL 16+ is running locally
# Create the database
createdb informedvoter

# Push the Prisma schema
npm run db:push

# Seed initial data
npm run db:seed
npx tsx prisma/seed-governors.mjs
npx tsx prisma/seed-elections.mjs
```

### Option B: Supabase (Recommended)

```bash
# 1. Create a project at https://app.supabase.com
# 2. Go to Project Settings → Database → Connection String
# 3. Copy the Connection Pooler URL for DATABASE_URL
# 4. Copy the Direct Connection URL for DIRECT_URL

# Update .env:
DATABASE_URL="postgresql://postgres.[project]:[password]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project]:[password]@db.[project].supabase.co:5432/postgres"

# Push schema and seed
npx prisma db push
npx tsx prisma/seed.ts
npx tsx prisma/seed-governors.mjs
npx tsx prisma/seed-elections.mjs
```

---

## Start Dev Server

```bash
npm run dev
```

- Opens at `http://localhost:3000`
- Turbopack enabled for fast incremental builds
- Prisma client is auto-generated via `postinstall`

---

## First Change Exercise

Try making a small visible change to verify the dev workflow:

1. Open `src/app/page.tsx`
2. Change a heading text
3. Save — Turbopack should hot-reload the page instantly
4. Verify the change in the browser

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Run seed scripts |
| `npm run db:studio` | Open Prisma Studio |


---

## Troubleshooting

### "PrismaClientInitializationError"
- Run `npx prisma generate` to regenerate the client.
- Ensure `DATABASE_URL` is correct and PostgreSQL is running.

### "Module not found: @/components/..."
- Ensure `tsconfig.json` `"paths"` mapping is correct.
- Restart the dev server if `tsconfig.json` was changed.

### "Redis connection refused"
- Redis is optional for local development.
- Rate limiting will silently allow all requests.
- To enable Redis locally, set `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` in `.env`, or install Redis locally and use `redis://localhost:6379`.

### "Unauthorized" on cron routes locally
- Set `ALLOW_MANUAL_CRON=true` in `.env`
- Append `?manual=true` to the cron URL
- **Never commit `.env` with this enabled.**

### Build fails on Vercel
- Ensure `output: "standalone"` is NOT in `next.config.mjs` (Vercel handles output automatically)
- Verify all required env vars are set in Vercel Dashboard

### Supabase connection errors
- Ensure `?pgbouncer=true` is in `DATABASE_URL` (for app connections)
- Use `DIRECT_URL` (without pooler) for Prisma migrations and seeds
- Check that IP allowlist in Supabase includes your machine's IP

---

## Vercel Deployment (Quick Start)

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add ANTHROPIC_API_KEY
vercel env add CRON_SECRET
# ... etc

# Deploy to production
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments on push.

---

## Where to Go Next

- **Architecture:** See `02_ARCHITECTURE.md`
- **Data Model:** See `03_DATA_MODEL.md`
- **Routing & API:** See `04_ROUTING.md`
- **Security:** See `07_SECURITY.md`
- **Deployment:** See `08_DEPLOYMENT.md`
- **Vercel/Supabase Migration:** See `13_VERCEL_SUPABASE_MIGRATION.md`
- **Project conventions:** See `AGENTS.md` at project root
