# 02 — Architecture

> **Last Updated:** 2026-06-05

---

## High-Level System Diagram (Current Stack)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER (Browser)                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network (CDN)                         │
│                   SSL • Static files • Image optimization                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Next.js 16 (Serverless Functions)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │   App Router │  │  API Routes  │  │    Vercel Cron Jobs          │  │
│  │  (pages)     │  │  (REST)      │  │  (13 scheduled sync jobs)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────────┘  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │   Prisma ORM │  │  Claude AI   │  │    Upstash / Vercel KV       │  │
│  │  (Supabase)  │  │  (Anthropic) │  │    (rate limiting)           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
┌─────────────────────────┐                 ┌─────────────────────────┐
│    Supabase Postgres     │                 │    Upstash Redis        │
│   (managed + pooler)     │                 │   (rate limit counters) │
└─────────────────────────┘                 └─────────────────────────┘
```

---

## Frontend Architecture

### Routing
- **Next.js App Router** (`src/app/`) with file-based routing.
- Dynamic segments for states (`[stateAbbr]`), candidates (`[candidateId]`), cities (`[id]`), etc.
- API routes co-located under `src/app/api/`.

### Server vs Client Components
- **Server Components (default)** — All state pages, candidate detail, judicial pages, agency detail, bill pages, city detail, about/contact/privacy. They query Prisma directly and pass serialized data to child components.
- **Client Components (`"use client"`)** — Used exclusively for interactivity:
  - `LocalHubPage` — search form with router navigation
  - `MeetingPage` — fetches meeting from API, template generation state
  - `TemplatesPage` — tone toggle, expand/collapse, clipboard
  - `ComparePage` — table shell with client data fetching
  - `PollingPlacesPage` — address input and results
  - Various UI components: `DistrictFinder`, `BallotAddressInput`, `BillDetailTabs`, `CandidateTabs`, `PacRecipientsTable`, `SubscribeForm`

### State Management
- **TanStack Query (React Query v5)** — Server-state caching, invalidation, background refetching.
  - Configured in `src/app/providers.tsx` with `staleTime: 5min`, `gcTime: 10min`, `retry: 1`
- **localStorage / Cookie** — `useUserState` hook persists selected US state in a cookie (`selected-state`, 1-year expiry, `SameSite=Lax`, `Secure` on HTTPS).
- No global client-state library (Redux/Zustand) — local component state is sufficient.

### Component Hierarchy
```
RootLayout
├── Providers (TanStack Query)
├── Header
│   └── Navigation (mobile drawer)
├── StateRequiredBanner
├── <main id="main-content">
│   └── (route-specific page)
│       └── (feature sections)
│           └── (UI components)
├── Footer
└── SubscribeBottomBar
```

---

## Backend Architecture

### API Pattern
- Route handlers in `src/app/api/<route>/route.ts` export `GET`, `POST`, etc.
- No traditional Express server — pure Next.js App Router API routes.

### Middleware (`src/middleware.ts`)
Runs on **all** `/api/*` routes:

| Route Prefix | Rate Limit | Auth |
|--------------|-----------|------|
| `/api/ai/*` | 300 req / 60s | Bearer token via `CRON_SECRET` (timing-safe compare) |
| `/api/cron/*` | 300 req / 60s | Bearer token OR `?secret=` query param via `verifyCronSecret()` |
| `/api/subscribe` (POST) | 5 req / 60s | None |
| All other `/api/*` | 60 req / 60s | None |

- Redis-backed fixed-window rate limiting (`src/lib/rate-limit.ts`).
- Fails open when Redis is unavailable.
- `timingSafeCompare` for constant-time token comparison (prevents timing attacks).
- IP detection order: `cf-connecting-ip` → `x-vercel-forwarded-for` → `x-real-ip` → rightmost entry of `x-forwarded-for` → `"unknown"`

### Auth Flow
- **No user login/auth system** — bookmarks are keyed by email (soft user model).
- **AI routes** protected by `Authorization: Bearer <CRON_SECRET>`.
- **Cron routes** protected by `verifyCronSecret(request)`, which checks Bearer header then `?secret=` query param.
- **Dev bypass** — `ALLOW_MANUAL_CRON=true` + `?manual=true` (local only, cron routes).
- `verifyCronSecret(request)` in `src/lib/auth.ts` uses Node's `timingSafeEqual` with a dummy comparison on length mismatch to prevent secret-length leakage.

---

## Data Flow

### Example 1: Bill Analysis (Cron)
```
External API (Congress.gov)
        ↓
    Cron Job: /api/cron/sync-bills
        ↓
    Prisma: bill.upsert()
        ↓
    Cron Job: /api/cron/analyze-bills
        ↓
    Claude API (claude-haiku-4-5)
        ↓
    Prisma: bill.update({ executiveSummary, detailedSummary, aiRiderAnalysis })
        ↓
    DataSyncLog.create()
```

### Example 2: Page Render (Server Component)
```
User requests /state/CA/senators
        ↓
    Server Component queries Prisma:
      Candidate.findMany({ where: { state: { abbreviation: 'CA' }, officeType: 'US_SENATOR' } })
        ↓
    Prisma returns candidates with relations (policies, votes, bills)
        ↓
    Component serializes data, renders HTML
        ↓
    Client hydrates interactive elements (tabs, accordions)
```

### Example 3: Interactive Feature (Client Component)
```
User searches city on /local
        ↓
    Client Component fetches /api/local/municipality?q=Seattle
        ↓
    API route queries Prisma: Municipality.findFirst()
        ↓
    JSON response → Client state updates → UI re-renders
```

---

## Caching Strategy

| Layer | Strategy | Config |
|-------|----------|--------|
| **Pages** | `force-dynamic` for state routes (real 404s for invalid states) | `export const dynamic = "force-dynamic"` |
| **Static pages** | ISR | `revalidate = 86400` (about, contact, privacy) |
| **API routes** | `revalidate` for external proxies | USAspending: `86400`, Google Civic: `3600` |
| **Client** | TanStack Query | `staleTime: 5min`, `gcTime: 10min` |
| **Cron routes** | No cache | `cache: "no-store"` |

---

## Third-Party Integrations

| Service | Purpose | Integration Point |
|---------|---------|-------------------|
| Congress.gov API | Member & bill data | `sync-members`, `sync-bills`, `sync-votes` |
| LegiScan API | State legislation | `sync-bills` |
| FEC / OpenFEC | Campaign finance | `sync-campaign-finance`, `sync-pac-contributions` |
| Google Civic API | Election dates, polling places, districts | `sync-elections`, `/api/polling-places`, `/api/district-lookup` |
| Oyez + CourtListener | SCOTUS cases & justices | `sync-scotus` |
| USAspending.gov | Federal agency budgets | `/api/agencies` |
| Anthropic Claude | AI summaries & templates | `src/lib/ai/claude-client.ts` |
| Resend | Transactional email | `src/lib/resend.ts` |
| Legistar/Granicus | Local meeting data | `src/lib/local/legistar-client.ts` |

---

## AI Integration (`src/lib/ai/claude-client.ts`)

Claude is used for five analysis types:

1. **`analyzeBill`** — Plain-English summary, key provisions, fiscal impact, political context.  
   Model: `claude-haiku-4-5`, max 15k bill text.
2. **`detectRiders`** — Flags unrelated provisions buried in legislation.  
   Model: `claude-sonnet-4-5`, max 20k text.
3. **`analyzeCandidatePolicy`** — Balanced policy analysis with supporter / critic perspectives + consistency score.  
   Model: `claude-sonnet-4-5`.
4. **`analyzeCourtCase`** — Plain-English SCOTUS summary + real-world impact.  
   Model: `claude-haiku-4-5`.
5. **`generateSpeakingTemplate`** — Grassroots speaking template for city council agenda items.  
   Model: `claude-sonnet-4-5`. Professional or assertive tone.

All functions return typed JSON parsed from Claude responses.  
The client includes `extractJson()` to handle markdown code fences in model output.

**Cost control:** Batch routes limit to 5–10 items per run with 500ms–1000ms delays between calls.

**Security:** `wrapUserContent()` prevents prompt injection by wrapping user text in `<user_content>` tags and stripping premature closers.

---

## Data Sync (Cron Jobs)

Cron jobs are triggered via Vercel Cron Jobs (see `vercel.json`).  
All cron routes live in `src/app/api/cron/<job>/route.ts`.

| Job | Schedule | Source |
|-----|----------|--------|
| `sync-members` | Daily 6:00 AM | Congress.gov |
| `sync-scotus` | Daily 5:00 AM | Oyez + CourtListener |
| `sync-bills` | Daily 7:00 AM | Congress.gov + LegiScan |
| `sync-votes` | Daily 8:00 AM | Congress.gov |
| `analyze-bills` | Daily 12:00 PM | Claude AI |
| `analyze-cases` | Daily 2:00 PM | Claude AI |
| `analyze-candidates` | Daily 1:00 PM | Claude AI |
| `sync-campaign-finance` | Weekly (Mon 9:00 AM) | OpenFEC |
| `sync-elections` | Weekly (Mon 10:00 AM) | Google Civic |
| `sync-voter-info` | Monthly (1st, 11:00 AM) | Static dataset (all 50 states) |
| `sync-pac-contributions` | Weekly (Wed 10:00 AM) | FEC |
| `sync-local-meetings` | Daily 4:00 AM | Legistar / Granicus |
| `send-digest` | Daily 3:00 PM | Resend email |

Sync results are logged to the `DataSyncLog` table.

**Patterns observed:**
- **Upsert-heavy:** Nearly all sync jobs use upsert (by `externalId`, `bioguideId`, `oyezId`, or composite keys) for idempotent reruns.
- **Incremental:** `sync-scotus` skips recently synced justices (30d), fully-decided cases, and justices with no new disclosures. Schedule-aware (hourly in June opinion season, weekly in recess).
- **Batch resilience:** AI analysis and cron jobs process items individually so one failure doesn't abort the batch.
- **Graceful degradation:** Google Civic proxies return empty arrays with notices if the API key is missing. Judicial pages wrap DB queries in try/catch.
