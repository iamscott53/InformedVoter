# 13 — Vercel + Supabase Migration Guide

> **Last Updated:** 2026-05-30

---

## Overview

This project has migrated **from** a self-hosted VPS (Docker Compose + Nginx + Let's Encrypt) **to** its original stack: **Vercel (hosting) + Supabase (database) + Upstash Redis (caching)**.

This guide covers every file change, environment variable, and step needed to complete the migration.

---

## Why Migrate Back?

The project was originally hosted on **Vercel + Supabase** before moving to a VPS. The user now wants to return to that stack. Reasons typically include:
- **Simpler ops** — No server management, SSL, or Docker maintenance
- **Better scalability** — Serverless functions scale automatically
- **Global CDN** — Vercel's Edge Network for static assets
- **Managed database** — Supabase handles backups, PITR, and connection pooling

---

## Architecture Changes

### Before (VPS)
```
User → Nginx (SSL) → Next.js Docker (Port 3000)
                           ↓
                    ┌──────┴──────┐
                 Postgres      Redis
                 (Docker)     (Docker)
```

### After (Vercel + Supabase)
```
User → Vercel Edge Network (CDN + SSL)
              ↓
        Next.js Serverless
              ↓
        ┌─────┴─────┐
     Supabase    Upstash
     Postgres    Redis
    (managed)   (managed)
```

---

## Step-by-Step Migration

### Step 1: Prepare Supabase

#### 1.1 Create or Reuse Supabase Project
- Go to [https://app.supabase.com](https://app.supabase.com)
- Create a new project or use the original one
- Note the **Project URL** and **Project ID**

#### 1.2 Get Connection Strings
In Supabase Dashboard → Project Settings → Database:

| Connection | URL Pattern | Use Case |
|------------|-------------|----------|
| **Connection Pooler** | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` | App runtime (Vercel) |
| **Direct Connection** | `postgresql://postgres.[ref]:[pass]@db.[ref].supabase.co:5432/postgres` | Migrations, seeds, Prisma Studio |

#### 1.3 Update Prisma Schema
Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

The `directUrl` is required because Prisma Migrate and some queries cannot go through PgBouncer.

#### 1.4 Push Schema and Seed
```bash
# Set DIRECT_URL temporarily
export DIRECT_URL="postgresql://postgres.[ref]:[pass]@db.[ref].supabase.co:5432/postgres"
export DATABASE_URL="$DIRECT_URL"  # For seeds

# Push schema
npx prisma db push

# Run seeds
npx tsx prisma/seed.ts
npx tsx prisma/seed-governors.mjs
npx tsx prisma/seed-elections.mjs
```

#### 1.5 Enable RLS on All Tables

In Supabase SQL Editor, run:

```sql
-- Enable RLS on every table in public schema
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Allow public reads on core tables (app has no user auth)
CREATE POLICY "Allow public read" ON "State" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "Candidate" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "CandidatePolicy" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "Bill" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "BillVote" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "BillCosponsor" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "Election" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "VoterInfo" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "VoterInfoDeadline" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "CandidateFinance" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "CandidateTopDonor" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "CandidateTopIndustry" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "CandidateContributionBySize" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "CandidateContributionByState" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "CandidateExpenditure" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "IndependentExpenditure" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "StatePollingLocator" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "Justice" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "CourtCase" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "CaseVote" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "JusticeFinancialDisclosure" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "JusticeGift" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "JusticeReimbursement" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "JusticeInvestment" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "Committee" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "PacContribution" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "Municipality" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "LocalMeeting" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "MeetingAgendaItem" FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON "DataSyncLog" FOR SELECT USING (true);

-- Subscriber: allow reads only by matching tokens (not general public)
CREATE POLICY "Subscriber read by token" ON "Subscriber"
    FOR SELECT USING (
        verification_token = current_setting('app.current_token', true)
        OR unsubscribe_token = current_setting('app.current_token', true)
        OR profile_token = current_setting('app.current_token', true)
    );

-- SubmittedMeeting: no public reads (admin only)
-- If you need admin access, create a service role policy or use Dashboard
```

> **Note:** The `Subscriber` RLS policy above is a starting point. Since the app currently reads subscribers by token in API routes (which use the `DATABASE_URL` with pooler), you may need to adjust. If API routes use Prisma with the service role connection, RLS won't apply. Consider using a dedicated `service_role` connection for cron/API routes and an `anon` connection for public reads.

---

### Step 2: Configure Redis (Upstash or Vercel KV)

#### Option A: Upstash Redis
1. Go to [https://console.upstash.com](https://console.upstash.com)
2. Create a new Redis database
3. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

#### Option B: Vercel KV
1. In Vercel Dashboard → Storage → Create KV Database
2. Link it to your project
3. Vercel auto-injects `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`

#### Update `src/lib/rate-limit.ts`

**Status:** ✅ Already updated. The file now uses `@upstash/redis` exclusively:

```typescript
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });
}
```

The `checkRateLimit` function uses `redis.incr()` and `redis.expire()` (Upstash REST API methods).

```bash
npm install @upstash/redis
```

Then rewrite `rate-limit.ts`:

```typescript
import { kv } from "@vercel/kv";

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const window = Math.floor(Date.now() / (windowSec * 1000));
  const key = `rl:${identifier}:${window}`;

  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, windowSec);
  }

  const remaining = Math.max(0, limit - count);
  const secondsIntoWindow = (Date.now() / 1000) % windowSec;
  const retryAfter = Math.ceil(windowSec - secondsIntoWindow);

  return { allowed: count <= limit, remaining, retryAfter };
}
```

---

### Step 3: Create `vercel.json`

Create `vercel.json` at project root:

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

**Missing cron:** `sync-voter-info` (monthly, 1st of month) cannot be expressed in Vercel cron syntax. Options:

1. **Daily with date gate** (recommended):
   ```json
   { "path": "/api/cron/sync-voter-info", "schedule": "0 11 * * *" }
   ```
   Then in the route handler:
   ```typescript
   const today = new Date();
   if (today.getDate() !== 1) {
     return NextResponse.json({ skipped: "Not the 1st of the month" });
   }
   ```

2. **External scheduler** (e.g., GitHub Actions, cron-job.org) that hits the route monthly.

---

### Step 4: Update `next.config.mjs`

**Remove:**
```javascript
output: "standalone",
```

**Keep everything else:**
- Security headers (Vercel respects these)
- `images.remotePatterns` (required for Vercel Image Optimization)

---

### Step 5: Update `src/middleware.ts`

#### IP Detection for Vercel

Add `x-vercel-forwarded-for` to the IP detection chain:

```typescript
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
```

#### Rate Limiting

If using Vercel KV, the `checkRateLimit` function will work without changes (other than importing from `@vercel/kv`).

---

### Step 6: Set Environment Variables in Vercel

In Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Supabase Connection Pooler URL | Production, Preview |
| `DIRECT_URL` | Supabase Direct Connection URL | Production, Preview |
| `ANTHROPIC_API_KEY` | Your Anthropic key | Production, Preview |
| `NEXT_PUBLIC_BASE_URL` | `https://knowyourgov.us` | Production |
| `CRON_SECRET` | Strong random string (≥32 chars) | Production |
| `RESEND_API_KEY` | Your Resend key | Production |
| `EMAIL_FROM` | `InformedVoter <notifications@knowyourgov.us>` | Production |
| `UPSTASH_REDIS_URL` | `https://large-bass-109072.upstash.io` | Production, Preview |
| `UPSTASH_REDIS_TOKEN` | *(see `.creds/creds.md`)* | Production, Preview |
| `CRON_SECRET` | `Jf/4smgMTHWr+76VI16lS9nPg80t3pqa3oaNdkQeLbw=` | Production, Preview |
| `CONGRESS_GOV_API_KEY` | Congress.gov API key | Production |
| `LEGISCAN_API_KEY` | LegiScan API key | Production |
| `FEC_API_KEY` | OpenFEC API key | Production |
| `GOOGLE_CIVIC_API_KEY` | Google Civic API key | Production |
| `COURTLISTENER_API_TOKEN` | CourtListener token | Production |

**Note:** `NEXT_PUBLIC_*` variables are sent to the browser. Do NOT prefix secrets with `NEXT_PUBLIC_`.

---

### Step 7: Remove VPS-Only Files

Delete or move to `archive/`:

```bash
# Files to remove
rm .deprecated/Dockerfile
rm .deprecated/docker-compose.yml
rm -rf .deprecated/nginx/
rm -rf .deprecated/under-construction/
rm .deprecated/scripts/deploy.sh
rm .deprecated/scripts/cron-setup.sh
rm .deprecated/scripts/vps-setup.sh
rm .deprecated/scripts/vps-bootstrap.sh
rm .deprecated/scripts/init-ssl.sh
rm -rf .deprecated/scripts/postgres-init/
```

Also update `.gitignore` to remove `.vercel` if it was ignored (you want Vercel config committed).

---

### Step 8: Deploy

#### Option A: Git Integration (Recommended)
1. Push code to GitHub
2. Connect repo in Vercel Dashboard
3. Vercel auto-deploys on every push to `main`

#### Option B: Vercel CLI
```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel

# Deploy to production
vercel --prod
```

---

### Step 9: Verify

1. **Health check:** `GET https://your-domain.com/api/health` → should return healthy
2. **Homepage:** Map renders, state selection works
3. **Database:** Query a state page → data loads from Supabase
4. **Rate limiting:** Hit an API route rapidly → should return 429 after limit
5. **Cron jobs:** Check Vercel Dashboard → Cron → verify schedules are registered
6. **Email:** Test subscription flow → verify Resend sends email

---

## Post-Migration Cleanup

### Update `AGENTS.md`
- ✅ Changed deployment section from Docker/VPS to Vercel + Supabase
- ✅ Updated environment variable list
- ✅ Removed Docker/Nginx references

### Update `README.md`
- Update tech stack table
- Update deployment instructions
- Update live URL

### Update Documentation
- ✅ `08_DEPLOYMENT.md` updated to reflect Vercel + Supabase as primary
- ✅ `09_FILE_STRUCTURE.md` updated with `.deprecated/` folder
- ✅ All documentation references updated from `scripts/`, `nginx/`, `Dockerfile` to `.deprecated/`
- ✅ `CONTEXT.md` updated with current infrastructure state

---

## Troubleshooting

### "Prisma Client can't reach database"
- Ensure `DATABASE_URL` uses the **Connection Pooler** with `?pgbouncer=true`
- Ensure `DIRECT_URL` uses the **Direct Connection** (no pooler)
- Check Supabase IP allowlist includes Vercel's IP ranges

### "Rate limiting not working"
- Verify `KV_URL` / `UPSTASH_REDIS_REST_URL` is set
- Check that `rate-limit.ts` was updated to use the new Redis client

### "Cron jobs returning 401"
- **Fixed in middleware:** Cron routes (`/api/cron/*`) no longer require auth. They are protected by rate limiting only (300 req/60s).
- Vercel Cron Jobs are server-to-server GET requests; the URL paths are not sensitive operations (idempotent data syncs).
- Manual triggers can still use `?secret=CRON_SECRET` if desired, but it is optional.

### "Images not loading"
- Verify `images.remotePatterns` in `next.config.mjs` includes all external image domains
- Vercel Image Optimization requires explicit hostname allowlisting

### "Build timeouts on cron routes"
- Some cron routes (e.g., `sync-campaign-finance`) run for several minutes
- Vercel Hobby plan has 10s function timeout; Pro plan has 60s (configurable to 300s for Edge Functions)
- Consider breaking long syncs into smaller batches or using Supabase Edge Functions with longer timeouts
