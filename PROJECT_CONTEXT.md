# InformedVoter — Project Context

> **Last Updated:** 2026-05-30  
> **Purpose:** Paste this into a new AI chat session to bring it up to speed on the entire project.

---

## 1. What Is This?

**InformedVoter** (`https://knowyourgov.us`) is a nonpartisan US civic information platform — the "Wikipedia for government." It helps voters research representatives, track legislation, follow Supreme Court cases, explore campaign finance, find polling places, and prepare for local city council meetings — all explained in plain English, often with AI-generated summaries.

**Stack:** Next.js 16 + TypeScript + Tailwind CSS v4 + Prisma 5.22 + PostgreSQL 16 + Redis 7 + Anthropic Claude + Resend email.

**Hosting History:** Originally on **Vercel + Supabase + Upstash Redis** → migrated to **self-hosted VPS (Docker Compose + Nginx)** → now migrating **back to Vercel + Supabase**.

---

## 2. Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 16.2+ | App Router, Turbopack in dev, `output: "standalone"` (VPS only) |
| Language | TypeScript 5.9+ | Strict mode, `@/*` → `./src/*` |
| Styling | Tailwind CSS v4 | `@import "tailwindcss"` in globals.css, no tailwind.config.js |
| ORM | Prisma 5.22 | PostgreSQL only, `postinstall` runs `prisma generate` |
| DB | PostgreSQL 16 | Currently self-hosted via Docker; migrating to **Supabase** |
| Cache / Rate Limit | Redis 7 | Currently `ioredis` (self-hosted); migrating to **Upstash / Vercel KV** |
| AI | Anthropic SDK 0.85 | `claude-haiku-4-5` (cheap), `claude-sonnet-4-5` (complex analysis) |
| State Mgmt | TanStack Query v5 | Server-state caching with `staleTime: 5min`, `gcTime: 10min` |
| Email | Resend | Verification + digest emails |
| Icons | Lucide React | Exclusive icon library |
| Animations | Framer Motion | Entrance animations, tabs, mobile drawer, accordions |
| Hosting | VPS (current) | Ubuntu 24.04, Docker Compose, Nginx, Certbot |
| Hosting (target) | Vercel | Serverless, CDN, image optimization, cron jobs |

---

## 3. Database Schema (Prisma)

**File:** `prisma/schema.prisma` — 25+ models across 7 domains.

### Key Models

| Model | Purpose |
|-------|---------|
| `State` | 50 US states + DC. Relations: candidates, bills, elections, voterInfo |
| `Candidate` | Elected officials & candidates. Relations: state, policies, bills (sponsored/voted/cosponsored), finance, PACs, bookmarks |
| `CandidatePolicy` | AI-generated policy analyses by category (10 categories). Unique on `(candidateId, category)` |
| `Bill` | Federal & state legislation. AI fields: `executiveSummary`, `detailedSummary`, `aiRiderAnalysis`, `hiddenClauses` (Json). Relations: sponsor, votes, cosponsors |
| `BillVote` | Roll-call votes. Unique on `(billId, candidateId)` |
| `CourtCase` | SCOTUS cases from Oyez. AI fields: `aiSummary`, `aiImpactAnalysis`. Relations: votes |
| `Justice` | SCOTUS justices. Relations: votes, gifts, reimbursements, investments, financial disclosures |
| `CandidateFinance` | Campaign finance totals per cycle. Relations: topDonors, topIndustries, contributionsBySize/State, expenditures |
| `Election` / `VoterInfo` / `VoterInfoDeadline` | Election dates and state voter registration rules |
| `Committee` / `PacContribution` | PACs and their contributions to candidates |
| `Municipality` / `LocalMeeting` / `MeetingAgendaItem` | Local gov: cities, council meetings, agenda items with `templatePrompt` |
| `Subscriber` | Email subscriptions with optional demographic profile (party, age, zip, issues, etc.) |
| `DataSyncLog` | Audit log for all cron sync jobs |

### Enums
`OfficeType`, `PolicyCategory`, `Chamber`, `BillStatus`, `VoteChoice`, `ElectionType`, `BookmarkEntityType`, `DonorType`, `ContributionSizeRange`, `ExpenditureCategory`, `SupportOrOppose`, `DeadlineType`, `SubscriberTopic`, `CaseStatus`

### Patterns
- All currency uses `Decimal @db.Decimal(18, 2)`
- Heavy use of `@@index` on foreign keys and filter columns
- Upsert-heavy sync jobs for idempotent reruns
- JSON fields for flexible data: `contactInfo`, `socialMedia`, `subjects`, `hiddenClauses`

---

## 4. Pages (App Router)

### Static / Marketing
- `/` — Homepage: interactive US map (`USStateMap`), `FederalAgenciesSection`, `HomepageLinks`
- `/about`, `/contact`, `/privacy` — ISR (revalidate 86400)

### State Hubs (`/state/[stateAbbr]/`)
All use `force-dynamic` for real 404s on invalid states.
- `/state/[stateAbbr]` — Dashboard with stats cards
- `/state/[stateAbbr]/senators` — US senators with votes & policies
- `/state/[stateAbbr]/representatives` — US reps with district badges
- `/state/[stateAbbr]/governor` — Governor profile
- `/state/[stateAbbr]/bills` — Bills with `BillsFilterBar` (search, chamber, status, subject)
- `/state/[stateAbbr]/bills/[billId]` — Bill detail with `BillDetailTabs` (Overview, Riders, Votes, Full Text)
- `/state/[stateAbbr]/elections` — Elections with days-until counter
- `/state/[stateAbbr]/voter-info` — Registration deadlines, ID requirements, early voting
- `/state/[stateAbbr]/state-legislature` — State legislature hub

### Candidates & Comparison
- `/candidate/[candidateId]` — Profile with `CandidateTabs` (Policy, Voting Record, Finance, Contact)
- `/compare` — Side-by-side comparison (client component, fetches `/api/candidates`)

### Judicial
- `/judicial` — SCOTUS dashboard (active justices, pending cases, recent decisions)
- `/judicial/cases/[...slug]` — Case detail with vote breakdown, AI summary
- `/judicial/justices/[slug]` — Justice profile with financial disclosures, gifts, ideology score

### Local Government
- `/local` — City/zip search, meeting submission (client component)
- `/local/city/[id]` — City hall info, council location, upcoming meetings
- `/local/meeting/[id]` — Meeting detail with agenda items, AI speaking templates (client)
- `/local/rules` — First Amendment speaking rules & case law
- `/local/templates` — Pre-built public comment templates with professional/assertive tone toggle (client)

### Utilities
- `/bills` — Federal bill listing (paginated)
- `/elections` — Nationwide upcoming elections
- `/agencies` — Federal agency directory with category filters
- `/agencies/[slug]` — Agency detail with live budget from USAspending.gov
- `/pac-recipients` — PAC catalog
- `/pac-recipients/[slug]` — PAC detail with contribution table
- `/polling-places` — Address-based polling place finder (client)
- `/voter-info` — Nationwide voter info basics

### SEO Files
- `sitemap.ts` — Dynamic sitemap from DB (states, justices, cases, candidates, agencies)
- `robots.ts` — Allows all except `/api/*`, `/api/cron/*`, `/api/ai/*`

---

## 5. API Routes

### Public Data APIs
- `GET /api/health` — Health check (`prisma.$queryRaw SELECT 1`)
- `GET /api/search?q=...` — Search bills & candidates
- `GET /api/bills` — Filtered bill listing with pagination
- `GET /api/candidates` — Filtered candidates (hard cap 200)
- `GET /api/agencies` — Agency catalog + USAspending.gov budget data (revalidate 24h)
- `GET /api/pac-recipients` — Aggregated PAC contributions by recipient

### Google Civic Proxies
- `GET /api/district-lookup` — Congressional district for address
- `GET /api/polling-places` — Polling locations for address

### AI APIs (Bearer auth)
- `POST /api/ai/analyze-bill` — Claude `analyzeBill` + `detectRiders`, persists results
- `POST /api/ai/analyze-candidate` — Claude `analyzeCandidatePolicy`, upserts `CandidatePolicy`

### Local Gov APIs
- `GET /api/local/municipality?q=...` — City lookup by zip or name
- `GET /api/local/meetings?municipalityId=...` — Meeting list
- `GET /api/local/meeting/[id]` — Single meeting detail
- `POST /api/local/meetings/submit` — Submit community meeting (creates `SubmittedMeeting`)
- `POST /api/local/template` — Generate AI speaking template for agenda item

### SCOTUS APIs
- `GET /api/scotus/cases` — Case list (filter by term/status)
- `GET /api/scotus/justices` — Justice list (filter by active)

### Subscription APIs
- `POST /api/subscribe` — Email signup → sends Resend verification email
- `GET /api/subscribe/verify?token=...` — Verify email (returns HTML page)
- `POST /api/subscribe/demographics` — Optional demographic survey
- `GET/POST /api/unsubscribe` — Unsubscribe via token (returns HTML page)

### Cron Jobs (13 total, all require Bearer `CRON_SECRET` or `?manual=true` in dev)

| Route | External Source | Schedule | What It Does |
|-------|----------------|----------|--------------|
| `sync-scotus` | Oyez + CourtListener | Daily 5AM | Justices, cases, votes, financial disclosures |
| `sync-members` | Congress.gov | Daily 6AM | Current members, deduped by bioguideId |
| `sync-bills` | Congress.gov + LegiScan | Daily 7AM | Bills, subjects, statuses (max 500/run) |
| `sync-votes` | Congress.gov + Clerk XML | Daily 8AM | Roll-call votes parsed from XML |
| `sync-campaign-finance` | OpenFEC | Weekly Mon 9AM | Finance totals, donors, expenditures (~50 candidates) |
| `sync-elections` | Google Civic | Weekly Mon 10AM | Election dates, infers PRIMARY/GENERAL/SPECIAL |
| `sync-voter-info` | Static dataset | Monthly 1st 11AM | Registration rules for all 50 states |
| `sync-pac-contributions` | OpenFEC | Weekly Wed 10AM | PAC contributions by candidate |
| `sync-local-meetings` | Legistar/Granicus | Daily 4AM | City council meetings, 90-day window |
| `analyze-bills` | Claude AI | Daily 12PM | Batch-analyze up to 10 unanalyzed bills |
| `analyze-candidates` | Claude AI | Daily 1PM | Batch-analyze 5 candidates × all policy categories |
| `analyze-cases` | Claude AI | Daily 2PM | Batch-analyze up to 5 decided SCOTUS cases |
| `send-digest` | Resend | Daily 3PM | Personalized email digests by state/topic |

All cron jobs log results to `DataSyncLog`.

---

## 6. External Integrations

| Service | Data | How It's Used |
|---------|------|---------------|
| **Congress.gov API** | Members, bills, votes, subjects | `sync-members`, `sync-bills`, `sync-votes` |
| **LegiScan API** | State/federal bills, full text, roll calls | `sync-bills` |
| **OpenFEC API** | Campaign finance, donors, expenditures, PACs | `sync-campaign-finance`, `sync-pac-contributions` |
| **Google Civic API** | Election dates, polling places, districts | `sync-elections`, `/api/polling-places`, `/api/district-lookup` |
| **Oyez API** | SCOTUS cases, justices, oral arguments | `sync-scotus` |
| **CourtListener API** | Justice financial disclosures | `sync-scotus` |
| **USAspending.gov API** | Federal agency budgets | `/api/agencies` |
| **Anthropic Claude** | AI summaries, rider detection, speaking templates | `claude-client.ts` (5 functions) |
| **Resend** | Transactional email | Verification + digest emails |
| **Legistar/Granicus API** | City council meetings, agendas | `sync-local-meetings` |

---

## 7. Key Files & Patterns

### State Management
- **`src/hooks/useUserState.ts`** — THE central hook. Reads/writes `selected-state` cookie (1yr, SameSite=Lax, Secure). Returns `{ userState, setUserState, isHydrating }`. Starts `null` to avoid hydration mismatches. **Dozens of components depend on this.**

### Database
- **`src/lib/db.ts`** — Singleton PrismaClient. Prevents connection leaks in dev via `globalThis` stash.

### Rate Limiting
- **`src/lib/rate-limit.ts`** — Redis fixed-window counter. Currently `ioredis` only. **Needs Upstash/Vercel KV support for Vercel migration.**

### AI
- **`src/lib/ai/claude-client.ts`** — 5 typed functions: `analyzeBill`, `detectRiders`, `analyzeCandidatePolicy`, `analyzeCourtCase`, `generateSpeakingTemplate`. Includes `extractJson()` for parsing markdown code fences.

### Auth
- **`src/middleware.ts`** — Rate limiting + cron auth on all `/api/*`. `timingSafeCompare` for constant-time Bearer token comparison.
- **`src/lib/auth.ts`** — `verifyCronSecret()` using Node `timingSafeEqual`.
- **No user login system.** App is fully public. Subscribers identified by email + token.

### Components
- **Server Components (default)** — Most pages query Prisma directly.
- **Client Components (`"use client"`)** — Only when interactivity needed: forms, maps, tabs, tables, drawers, modals.
- **Layout:** `Header` (sticky, active-page pill animation), `Navigation` (mobile drawer with focus trap), `Footer`, `SubscribeBottomBar` (fixed bottom, 30s/50% scroll trigger), `StateRequiredBanner`.

### Styling
- Brand color: `#1B2A4A` (deep navy)
- Headings: Serif font for trust/authority
- Tailwind v4: No `tailwind.config.js`, config in `globals.css`

---

## 8. Current vs Target Deployment

### Current (VPS)
```
Nginx → Next.js Docker → Postgres Docker + Redis Docker
Certbot (Let's Encrypt) handles SSL
Host-level cron (crontab) triggers jobs
scripts/deploy.sh for manual deploys
```

### Target (Vercel + Supabase)
```
Vercel Edge Network → Next.js Serverless
Supabase Postgres (managed, PgBouncer pooler)
Upstash Redis or Vercel KV (rate limiting)
Vercel Cron Jobs (vercel.json)
Git-based auto-deployment
```

### Files to Remove for Migration
`Dockerfile`, `docker-compose.yml`, `nginx/`, `under-construction/`, `scripts/deploy.sh`, `scripts/cron-setup.sh`, `scripts/vps-setup.sh`, `scripts/vps-bootstrap.sh`, `scripts/init-ssl.sh`, `scripts/postgres-init/`

### Files to Modify for Migration
- `prisma/schema.prisma` — Add `directUrl` for Supabase direct connection
- `src/lib/rate-limit.ts` — Add Upstash/Vercel KV support (currently `ioredis` only)
- `src/middleware.ts` — Add `x-vercel-forwarded-for` to IP detection
- `next.config.mjs` — Remove `output: "standalone"`
- Create `vercel.json` with cron schedules

---

## 9. Known Issues & Decisions Needed

| Issue | Context | Decision Needed |
|-------|---------|-----------------|
| **No automated tests** | Zero test suite (Jest, Vitest, Playwright, Cypress) | Add tests? Which runner? |
| **No formal DB migrations** | Uses `prisma db push` only | Switch to `prisma migrate dev` + Supabase migrations? |
| **Cron auth on Vercel** | Vercel Cron Jobs don't send Bearer headers natively | Use query param secret, Supabase Edge Functions, or GitHub Actions? |
| **RLS not enabled** | Self-hosted Postgres has no RLS. Supabase requires it. | Enable RLS on all tables with public-read policies? |
| **No user auth** | App is fully public. No login/session system. | Keep it public, or add Supabase Auth later? |
| **Long cron timeouts** | `sync-campaign-finance` can run for minutes | Vercel Hobby = 10s timeout, Pro = 60s. Break into batches or use Edge Functions? |
| **Monthly voter-info cron** | `0 11 1 * *` not supported by Vercel cron syntax | Change to daily with date gate, or use external scheduler? |
| **Image domains** | `next.config.mjs` allows `theunitedstates.io`, `bioguide.congress.gov`, `*.oyez.org` | Verify these are still correct after migration |

---

## 10. Environment Variables

### Required (All Deployments)
- `DATABASE_URL` — PostgreSQL connection string
- `ANTHROPIC_API_KEY` — Claude AI access
- `NEXT_PUBLIC_BASE_URL` — `http://localhost:3000` or production URL

### Required for Vercel + Supabase
- `DATABASE_URL` — Supabase Connection Pooler (`?pgbouncer=true`)
- `DIRECT_URL` — Supabase Direct Connection (for migrations/seeds)
- `KV_URL` / `UPSTASH_REDIS_REST_URL` — Redis for rate limiting
- `CRON_SECRET` — Protects cron/AI routes

### Required for Data Sync
- `CONGRESS_GOV_API_KEY`, `LEGISCAN_API_KEY`, `FEC_API_KEY`, `GOOGLE_CIVIC_API_KEY`, `COURTLISTENER_API_TOKEN`

### Required for Email
- `RESEND_API_KEY`, `EMAIL_FROM`

### Dangerous (Dev Only)
- `ALLOW_MANUAL_CRON=true` — **Never in production.** Allows `?manual=true` to bypass cron auth.

---

## 11. Quick Commands

```bash
npm run dev              # Local dev with Turbopack
npm run build            # Production build
npm run db:push          # Push Prisma schema
npm run db:seed          # Run seed.ts
npm run db:studio        # Prisma Studio GUI
```

---

## 12. Next Steps (For Planning)

The user is actively migrating from VPS to **Vercel + Supabase**. The main open questions are:

1. **Supabase setup** — Create project, push schema, run seeds, enable RLS
2. **Redis migration** — Choose Upstash vs Vercel KV, update `rate-limit.ts`
3. **Cron architecture** — Vercel Cron Jobs vs Supabase Edge Functions vs GitHub Actions
4. **Auth strategy** — Keep public (no auth) vs add Supabase Auth
5. **Code changes** — Remove VPS files, update configs, create `vercel.json`
6. **Testing** — Add automated test suite
7. **Monitoring** — Add error tracking (Sentry?) and uptime monitoring

---

## 13. File Structure Summary

```
src/
  app/                    # Next.js App Router (pages + API routes)
    api/                  # 30+ API routes including 13 cron jobs
    local/                # Local gov pages
    state/[stateAbbr]/    # State hub + 8 sub-pages
    judicial/             # SCOTUS dashboard
    candidate/[id]/       # Candidate profiles
    compare/              # Side-by-side comparison
    agencies/             # Federal agency directory
    layout.tsx            # Root layout with SEO, skip-link, providers
    globals.css           # Tailwind v4 + design tokens
    providers.tsx         # TanStack Query wrapper
    sitemap.ts, robots.ts # SEO primitives
  components/
    ui/                   # 8 reusable atomic components
    layout/               # Header, Footer, Navigation
    features/             # 20+ page-specific components
    seo/                  # JSON-LD structured data
  lib/
    ai/claude-client.ts   # 5 Claude AI functions
    email/                # HTML email templates
    local/legistar-client.ts # Granicus/Legistar API wrapper
    db.ts                 # Prisma singleton
    rate-limit.ts         # Redis rate limiter (needs Upstash support)
    auth.ts               # Cron auth helper
    resend.ts             # Email client
    sanitize.ts           # DOMPurify wrapper
    utils.ts              # cn(), formatters, color helpers
    agencies.ts           # 20 federal agencies (static catalog)
    fec.ts                # OpenFEC helpers
    pac-catalog.ts        # 23 notable PACs (static catalog)
  hooks/
    useUserState.ts       # Cookie-based state persistence (CRITICAL)
  types/
    index.ts              # Shared TS types & enums
  middleware.ts           # Rate limiting + cron auth on all /api/*
prisma/
  schema.prisma           # 25+ models, single source of truth
  seed.ts                 # States + sample data
  seed-governors.mjs      # All 50 governors
  seed-elections.mjs      # 2026 elections + deadlines
```

---

*End of context. Use this to plan architecture decisions, migration steps, new features, or refactoring.*
