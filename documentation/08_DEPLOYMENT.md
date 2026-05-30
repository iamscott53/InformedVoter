# 08 — Deployment

> **Last Updated:** 2026-05-30

---

## Deployment Target: Vercel + Supabase

This project is migrating from a **self-hosted VPS (Docker Compose)** back to its original stack of **Vercel (hosting) + Supabase (database) + Upstash Redis (caching/rate limiting)**.

---

## Current VPS Stack (Being Replaced)

- **Host:** Ubuntu 24.04 VPS (1-2 vCPU, 2-4 GB RAM)
- **IP:** `45.32.221.91`
- **Services:** PostgreSQL 16, Redis 7, Next.js (Docker), Nginx, Certbot
- **Deployment:** Manual via `scripts/deploy.sh`

See `09_FILE_STRUCTURE.md` for the full list of VPS-specific files.

---

## Target Stack: Vercel + Supabase

### Vercel
- **Framework:** Next.js 16 App Router
- **Features:** Automatic CDN, SSL, image optimization, serverless functions, cron jobs
- **Build:** `next build` (no `output: "standalone"` needed)
- **Analytics:** Vercel Web Analytics (was previously enabled)

### Supabase
- **Product:** Managed PostgreSQL 16
- **Connection:** PgBouncer connection pooler (for serverless)
- **Direct URL:** For Prisma migrations and seeds
- **RLS:** Must be enabled on all tables in `public` schema

### Upstash Redis
- **Product:** Managed Redis (REST API)
- **Use:** Rate limiting counters
- **Alternative:** Vercel KV (Redis-compatible, simpler integration)

---

## Files to Remove (VPS-Only)

| File/Directory | Reason |
|----------------|--------|
| `Dockerfile` | Vercel builds directly from source |
| `docker-compose.yml` | Not needed for serverless |
| `nginx/` (all configs) | Vercel handles CDN, SSL, static serving |
| `scripts/deploy.sh` | Replaced by Vercel Git integration |
| `scripts/vps-setup.sh` | VPS hardening — not needed |
| `scripts/vps-bootstrap.sh` | Not needed |
| `scripts/init-ssl.sh` | Vercel handles SSL |
| `scripts/cron-setup.sh` | Replaced by Vercel Cron Jobs |
| `under-construction/` | Maintenance mode not needed on Vercel |

---

## Files to Modify

### 1. `next.config.mjs`

**Remove:**
```javascript
output: "standalone",  // Vercel handles this automatically
```

**Keep:**
- Security headers (Vercel respects these)
- `images.remotePatterns` (required for Vercel Image Optimization)

### 2. `prisma/schema.prisma`

**Update datasource:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- `DATABASE_URL` = Supabase connection pooler URL (`?pgbouncer=true`)
- `DIRECT_URL` = Supabase direct connection URL (for migrations/seeds)

### 3. `src/lib/rate-limit.ts`

**Current:** Only implements `ioredis` (local Redis).  
**Required:** Add Upstash Redis REST client support.

The dependency `@upstash/redis` is already in `package.json` but the init code returns `null` for Upstash URLs.

### 4. `src/middleware.ts`

**IP Detection:** On Vercel, use `x-vercel-forwarded-for` or `x-real-ip` in addition to existing headers.

**Rate Limiting:** Ensure Redis connection works with Upstash/Vercel KV in Edge Runtime.

### 5. `vercel.json` (Create)

Create `vercel.json` at project root with cron schedules:

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "crons": [
    { "path": "/api/cron/sync-scotus", "schedule": "0 5 * * *" },
    { "path": "/api/cron/sync-members", "schedule": "0 6 * * *" },
    { "path": "/api/cron/sync-bills", "schedule": "0 7 * * *" },
    { "path": "/api/cron/sync-votes", "schedule": "0 8 * * *" },
    { "path": "/api/cron/sync-campaign-finance", "schedule": "0 9 * * 1" },
    { "path": "/api/cron/sync-elections", "schedule": "0 10 * * 1" },
    { "path": "/api/cron/analyze-bills", "schedule": "0 12 * * *" },
    { "path": "/api/cron/analyze-candidates", "schedule": "0 13 * * *" },
    { "path": "/api/cron/analyze-cases", "schedule": "0 14 * * *" },
    { "path": "/api/cron/sync-local-meetings", "schedule": "0 4 * * *" },
    { "path": "/api/cron/sync-pac-contributions", "schedule": "0 10 * * 3" },
    { "path": "/api/cron/send-digest", "schedule": "0 15 * * *" }
  ]
}
```

**Note:** `sync-voter-info` (monthly, 1st of month) cannot be expressed in Vercel cron syntax. Options:
1. Change to a daily cron and gate by date inside the handler
2. Use an external scheduler (e.g., GitHub Actions, cron-job.org)

---

## Environment Variables (Vercel + Supabase)

### Required

| Variable | Source | Value Example |
|----------|--------|---------------|
| `DATABASE_URL` | Supabase → Connection Pooler | `postgresql://postgres.[project]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase → Direct Connection | `postgresql://postgres.[project]:[password]@db.[project].supabase.co:5432/postgres` |
| `ANTHROPIC_API_KEY` | Anthropic Dashboard | `sk-ant-api03-...` |
| `NEXT_PUBLIC_BASE_URL` | Vercel Project Settings | `https://knowyourgov.us` or `https://informed-voter.vercel.app` |

### For Rate Limiting (Choose One)

| Variable | Source | Notes |
|----------|--------|-------|
| `UPSTASH_REDIS_REST_URL` | Upstash Console | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console | Long token string |
| `KV_URL` / `KV_REST_API_URL` | Vercel KV | If using Vercel KV instead |

### For Data Sync

| Variable | Source | Purpose |
|----------|--------|---------|
| `CONGRESS_GOV_API_KEY` | Congress.gov API | Members, bills, votes |
| `LEGISCAN_API_KEY` | LegiScan | State bills, full text |
| `FEC_API_KEY` | OpenFEC | Campaign finance |
| `GOOGLE_CIVIC_API_KEY` | Google Cloud Console | Elections, polling places, districts |
| `COURTLISTENER_API_TOKEN` | Free Law Project | SCOTUS cases, disclosures |
| `CRON_SECRET` | Self-generated (strong random string) | Protects `/api/cron/*` and `/api/ai/*` |

### For Email

| Variable | Source | Value |
|----------|--------|-------|
| `RESEND_API_KEY` | Resend Dashboard | `re_...` |
| `EMAIL_FROM` | Resend | `InformedVoter <notifications@knowyourgov.us>` |

### Dangerous (Local Dev Only)

| Variable | Value | Warning |
|----------|-------|---------|
| `ALLOW_MANUAL_CRON` | `true` | **Never in production.** Allows `?manual=true` to bypass cron auth. |

---

## Deployment Steps

### 1. Supabase Setup

```bash
# Create a new Supabase project (or use existing)
# Go to: https://app.supabase.com/project/_/settings/database

# Copy the connection strings:
# - Connection Pooler (for DATABASE_URL)
# - Direct Connection (for DIRECT_URL)
```

### 2. Schema Migration

```bash
# Set DIRECT_URL to Supabase direct connection
export DIRECT_URL="postgresql://postgres.[project]:[password]@db.[project].supabase.co:5432/postgres"

# Push schema
npx prisma db push

# Run seeds
npx tsx prisma/seed.ts
npx tsx prisma/seed-governors.mjs
npx tsx prisma/seed-elections.mjs
```

### 3. Enable RLS on All Tables

In Supabase SQL Editor, run:

```sql
-- Enable RLS on every table
ALTER TABLE "State" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Candidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidatePolicy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillCosponsor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Election" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoterInfo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoterInfoDeadline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserBookmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateFinance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateTopDonor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateTopIndustry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateContributionBySize" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateContributionByState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateExpenditure" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IndependentExpenditure" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StatePollingLocator" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Justice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourtCase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CaseVote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JusticeFinancialDisclosure" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JusticeGift" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JusticeReimbursement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JusticeInvestment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Committee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PacContribution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DataSyncLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Municipality" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LocalMeeting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MeetingAgendaItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubmittedMeeting" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all reads (app uses API routes for writes)
-- Repeat for each table:
CREATE POLICY "Allow public read" ON "State" FOR SELECT USING (true);
```

### 4. Vercel Project Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add ANTHROPIC_API_KEY
vercel env add NEXT_PUBLIC_BASE_URL
vercel env add CRON_SECRET
# ... add remaining variables
```

### 5. Deploy

```bash
# Push to main branch — Vercel auto-deploys
git push origin main
```

Or manual:
```bash
vercel --prod
```

### 6. Verify

- Check `/api/health` returns healthy
- Test a few cron jobs with `?manual=true` locally, then verify they run on schedule
- Check that rate limiting works with Upstash/Vercel KV

---

## Rollback Strategy

- Vercel keeps deployment history. Rollback via Vercel Dashboard → Deployments → Promote Previous.
- Database: Supabase provides point-in-time recovery (PITR) on Pro plans. For free tier, take manual dumps before risky changes.

---

## Architecture Comparison

```
Current (VPS/Docker):                    Target (Vercel + Supabase):
┌─────────────┐                          ┌─────────────┐
│   Nginx     │ 443/80                   │  Vercel Edge │ CDN + SSL
│  (reverse)  │                          │   Network    │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
┌──────▼──────┐                          ┌──────▼──────┐
│  Next.js    │ 3000                     │  Next.js    │ Serverless Functions
│  (Docker)   │                          │  (Vercel)   │
└──────┬──────┘                          └──────┬──────┘
       │                                        │
┌──────▼──────┐    ┌──────────┐          ┌──────▼──────┐
│  Postgres   │5432│  Redis   │6379      │  Supabase   │ Postgres + Pooler
│  (Docker)   │    │ (Docker) │          │   (managed) │
└─────────────┘    └──────────┘          └─────────────┘
                                              │
                                         ┌────▼────┐
                                         │ Upstash │ Redis
                                         │   KV    │
                                         └─────────┘
```
