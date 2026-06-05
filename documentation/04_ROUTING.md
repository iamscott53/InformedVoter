# 04 — Routing

> **Last Updated:** 2026-05-30

---

## App Router Pages

All pages live under `src/app/` and use the Next.js App Router file convention.

### Public Pages

| Route | File | Purpose | Type |
|-------|------|---------|------|
| `/` | `page.tsx` | Homepage with US map, state selector, feature overview | Static |
| `/about` | `about/page.tsx` | About the platform | ISR (revalidate 86400) |
| `/contact` | `contact/page.tsx` | Contact form / information | ISR (revalidate 86400) |
| `/privacy` | `privacy/page.tsx` | Privacy policy | ISR (revalidate 86400) |
| `/agencies` | `agencies/page.tsx` | Federal agency directory | Static |
| `/agencies/[slug]` | `agencies/[slug]/page.tsx` | Agency detail page (budget from USAspending.gov) | Server |
| `/bills` | `bills/page.tsx` | Federal bill listing (paginated) | Server |
| `/candidate/[candidateId]` | `candidate/[candidateId]/page.tsx` | Candidate profile (policies, finance, votes, bills) | Server |
| `/compare` | `compare/page.tsx` | Side-by-side candidate comparison | Client |
| `/elections` | `elections/page.tsx` | Upcoming elections (grouped by month) | Server |
| `/judicial` | `judicial/page.tsx` | SCOTUS dashboard (active justices, pending cases, gifts) | Server |
| `/judicial/cases/[...slug]` | `judicial/cases/[...slug]/page.tsx` | Case detail page (votes, AI summary) | Server |
| `/judicial/justices/[slug]` | `judicial/justices/[slug]/page.tsx` | Justice profile (votes, gifts, reimbursements, investments, disclosures) | Server |
| `/local` | `local/page.tsx` | Local government hub (city/zip search, meeting submission) | Client |
| `/local/rules` | `local/rules/page.tsx` | First Amendment speaking rules & case law | Server |
| `/local/templates` | `local/templates/page.tsx` | Template library for public comment (professional/assertive toggle) | Client |
| `/local/city/[id]` | `local/city/[id]/page.tsx` | City detail: city hall, council, upcoming meetings | Server |
| `/local/meeting/[id]` | `local/meeting/[id]/page.tsx` | Meeting detail: agenda, AI templates, restrictions | Client |
| `/pac-recipients` | `pac-recipients/page.tsx` | PAC recipient listing (static catalog) | Static |
| `/pac-recipients/[slug]` | `pac-recipients/[slug]/page.tsx` | PAC detail (client-fetched table) | Server + Client |
| `/polling-places` | `polling-places/page.tsx` | Polling place finder | Client |
| `/voter-info` | `voter-info/page.tsx` | Voter information hub | Static |
| `/state/[stateAbbr]` | `state/[stateAbbr]/page.tsx` | State overview (senators, reps, governor, bills, elections stats) | Server (force-dynamic) |
| `/state/[stateAbbr]/senators` | `state/[stateAbbr]/senators/page.tsx` | State's US senators with votes & policies | Server (force-dynamic) |
| `/state/[stateAbbr]/representatives` | `state/[stateAbbr]/representatives/page.tsx` | State's US representatives with district badges | Server (force-dynamic) |
| `/state/[stateAbbr]/governor` | `state/[stateAbbr]/governor/page.tsx` | Governor profile with term dates & policies | Server (force-dynamic) |
| `/state/[stateAbbr]/bills` | `state/[stateAbbr]/bills/page.tsx` | State bills (filterable by chamber, status, search) | Server (force-dynamic) |
| `/state/[stateAbbr]/bills/[billId]` | `state/[stateAbbr]/bills/[billId]/page.tsx` | Bill detail: AI summary, riders, votes, timeline | Server |
| `/state/[stateAbbr]/elections` | `state/[stateAbbr]/elections/page.tsx` | State elections (days-until counter) | Server (force-dynamic) |
| `/state/[stateAbbr]/voter-info` | `state/[stateAbbr]/voter-info/page.tsx` | State voter info (deadlines, ID requirements, early voting) | Server (force-dynamic) |

### Special Files

| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout with SEO meta, skip-link, providers |
| `error.tsx` | Global error boundary |
| `not-found.tsx` | 404 page |
| `loading.tsx` | Global loading UI |
| `globals.css` | Tailwind v4 import + CSS custom properties |
| `providers.tsx` | TanStack Query client wrapper |
| `sitemap.ts` | Dynamic sitemap generation (states, justices, cases, candidates, agencies) |
| `robots.ts` | robots.txt (allows all except `/api/*`, `/api/cron/*`, `/api/ai/*`) |

---

## API Routes

All API routes live under `src/app/api/<route>/route.ts`.

### Public Data APIs

| Route | Method | Auth | DB Queries / External Calls | Purpose |
|-------|--------|------|----------------------------|---------|
| `/api/health` | `GET` | None | `prisma.$queryRaw` SELECT 1 | Health check for Docker/load balancers |
| `/api/search` | `GET` | None | `prisma.bill.findMany` (title), `prisma.candidate.findMany` (name) | Full-text search across bills & candidates |
| `/api/bills` | `GET` | None | `prisma.bill.count/findMany` with filters (state, chamber, status, pagination) | Filtered bill API with pagination metadata |
| `/api/candidates` | `GET` | None | `prisma.candidate.findMany` with filters (state, officeType, party), hard cap 200 | Filtered candidate API |
| `/api/agencies` | `GET` | None | `fetch(USAspending.gov)` (revalidate 24h) | Agency catalog enriched with live budget data |
| `/api/pac-recipients` | `GET` | None | `prisma.committee`, `prisma.pacContribution.groupBy`, `prisma.candidate` | Aggregated PAC $ by recipient candidate |

### Google Civic Proxies

| Route | Method | Auth | External API | Purpose |
|-------|--------|------|--------------|---------|
| `/api/district-lookup` | `GET` | None | Google Civic `representatives` | Congressional district + rep for address |
| `/api/polling-places` | `GET` | None | Google Civic `voterinfo` | Polling locations, early vote sites, drop boxes |

### AI On-Demand APIs

| Route | Method | Auth | DB Queries | External Calls | Purpose |
|-------|--------|------|------------|----------------|---------|
| `/api/ai/analyze-bill` | `POST` | Bearer | `prisma.bill.findUnique` | Claude `analyzeBill` + `detectRiders` | Generates & persists AI summaries |
| `/api/ai/analyze-candidate` | `POST` | Bearer | `prisma.candidate.findUnique` with votes | Claude `analyzeCandidatePolicy` | Generates & upserts `CandidatePolicy` |

### Local Government APIs

| Route | Method | Auth | DB Queries | Purpose |
|-------|--------|------|------------|---------|
| `/api/local/municipality` | `GET` | None | `prisma.municipality.findFirst` (by zip or city name) | City lookup with upcoming meetings |
| `/api/local/meetings` | `GET` | None | `prisma.localMeeting.findMany` (by municipalityId) | List meetings with agenda items |
| `/api/local/meeting/[id]` | `GET` | None | `prisma.localMeeting.findUnique` with municipality + agendaItems | Single meeting detail |
| `/api/local/meetings/submit` | `POST` | None | `prisma.submittedMeeting.create` | Community meeting submission (pending review) |
| `/api/local/template` | `POST` | None | — | Claude `generateSpeakingTemplate` for agenda items |

### SCOTUS APIs

| Route | Method | Auth | DB Queries | Purpose |
|-------|--------|------|------------|---------|
| `/api/scotus/cases` | `GET` | None | `prisma.courtCase.findMany` (filter by term/status) | Case list API |
| `/api/scotus/justices` | `GET` | None | `prisma.justice.findMany` (filter by active) | Justice list with vote/gift counts |

### Subscription APIs

| Route | Method | Auth | DB Queries | External Calls | Purpose |
|-------|--------|------|------------|----------------|---------|
| `/api/subscribe` | `POST` | None | `prisma.subscriber.upsert` | Resend verification email | Email signup |
| `/api/subscribe/verify` | `GET` | None | `prisma.subscriber.findUnique` + update | — | Verify email (returns HTML page) |
| `/api/subscribe/demographics` | `POST` | None | `prisma.subscriber.update` | — | Optional demographic survey |
| `/api/unsubscribe` | `GET/POST` | None | `prisma.subscriber.delete` | — | Unsubscribe via token (returns HTML) |

### Cron Jobs (Data Sync)

All cron routes require `Authorization: Bearer <CRON_SECRET>` OR `?secret=<CRON_SECRET>` query param (or `?manual=true` in dev with `ALLOW_MANUAL_CRON=true`).

| Route | External APIs | DB Writes | Schedule | Notes |
|-------|--------------|-----------|----------|-------|
| `/api/cron/sync-members` | Congress.gov `/member` | `candidate.upsert` (by bioguideId) | Daily 6AM | Deduplicates by bioguideId, resolves state |
| `/api/cron/sync-bills` | Congress.gov `/bill` + detail + subjects | `bill.upsert` (by externalId) | Daily 7AM | Max 500/run; maps status from action text |
| `/api/cron/sync-votes` | Congress.gov `/house-vote` + Clerk XML | `billVote.upsert` | Daily 8AM | Parses XML regex for individual votes |
| `/api/cron/sync-scotus` | Oyez `/justices`, `/cases`, `/people` + CourtListener | `justice.upsert`, `courtCase.upsert`, `caseVote.upsert`, financial disclosures | Daily 5AM | Incremental: skips recently synced (30d) |
| `/api/cron/analyze-bills` | Claude API | `bill.update` (summary, riders) | Daily 12PM | Batch: up to 10 unanalyzed bills |
| `/api/cron/analyze-candidates` | Claude API | `candidatePolicy.upsert` | Daily 1PM | Batch: 5 candidates × all categories |
| `/api/cron/analyze-cases` | Claude API | `courtCase.update` (aiSummary) | Daily 2PM | Batch: up to 5 decided cases |
| `/api/cron/sync-campaign-finance` | OpenFEC `/candidates/search`, `/totals`, `/schedules` | `candidateFinance.upsert`, donors, expenditures, contributions | Weekly Mon 9AM | Stale-first ordering; ~50 candidates/run |
| `/api/cron/sync-elections` | Google Civic `/elections` | `election.upsert` | Weekly Mon 10AM | Skips VIP test election (id 2000) |
| `/api/cron/sync-voter-info` | Static dataset (50 states hardcoded) | `voterInfo.upsert` | Monthly 1st 11AM | Seeds registration rules for every state |
| `/api/cron/sync-local-meetings` | Legistar API | `localMeeting.upsert`, agenda items | Daily 4AM | 90-day window for municipalities with legistarClient |
| `/api/cron/sync-pac-contributions` | OpenFEC `/schedules/schedule_a` | `committee.upsert`, `pacContribution.upsert` | Weekly Wed 10AM | Stale-first ordering |
| `/api/cron/send-digest` | — | `subscriber.findMany`, `bill.findMany`, etc. | Daily 3PM | Groups by state; sends personalized Resend emails |

---

## Middleware

**File:** `src/middleware.ts`  
**Matcher:** `/api/:path*` (all API routes)

Behavior:
1. Extracts client IP from `cf-connecting-ip` → `x-vercel-forwarded-for` → `x-real-ip` → rightmost `x-forwarded-for`
2. Protected routes (`/api/ai/*`, `/api/cron/*`) require valid auth token
   - `/api/ai/*`: Bearer header only
   - `/api/cron/*`: Bearer header OR `?secret=` query param (validated in both middleware and route handler)
   - Dev bypass: `ALLOW_MANUAL_CRON=true` + `?manual=true` (cron only, local dev)
   - Returns 500 if `CRON_SECRET` is not configured
   - Returns 401 if token mismatch
3. Applies tiered rate limits via Redis:
   - Protected: 300 req/60s (`auth:${ip}`)
   - Subscribe POST: 5 req/60s (`sub:${ip}`)
   - Public: 60 req/60s (`pub:${ip}`)
4. Returns `429` with `Retry-After` header when limit exceeded
5. Falls open (allows all) if Redis is unavailable

---

## State Selection Flow

Many routes are state-scoped. The flow works like this:

1. `useUserState` hook reads/writes a `selected-state` cookie
2. `Header` / `Navigation` prepend `/state/{abbr}` to bills/elections/voter-info links when state is selected
3. `USStateMap` (homepage), `StateSelector` (header), `StateDetector` (pages) all call `setUserState()`
4. `StateRequiredBanner` gates content with an amber banner when `userState` is null
5. If no state is selected, nav links redirect to `/#select-state` anchor
