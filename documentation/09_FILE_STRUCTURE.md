# 09 — File Structure

> **Last Updated:** 2026-05-30

---

## Directory Tree

```
.
├── .creds/                      # Credentials (gitignored)
│   └── creds.md                 # Infrastructure secrets
├── .deprecated/                 # Old VPS config & IDE artifacts (gitignored)
│   ├── .agents/                 # Agent IDE config
│   ├── .claude/                 # Claude Code settings
│   ├── .continue/               # Continue IDE config
│   ├── Dockerfile               # Multi-stage production build (VPS-only)
│   ├── docker-compose.yml       # Production stack definition (VPS-only)
│   ├── nginx/                   # Nginx configs (VPS-only)
│   ├── scripts/                 # VPS deployment scripts
│   ├── under-construction/      # Standalone maintenance page (VPS-only)
│   └── README.md                # What's in this folder
├── .next/                       # Next.js build output (gitignored)
├── documentation/               # PROJECT DOCUMENTATION
│   ├── CONTEXT.md               # AI session bootstrapper
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_DATA_MODEL.md
│   ├── 04_ROUTING.md
│   ├── 05_FRONTEND.md
│   ├── 06_COMPONENTS.md
│   ├── 07_SECURITY.md
│   ├── 08_DEPLOYMENT.md
│   ├── 09_FILE_STRUCTURE.md
│   ├── 10_TESTING.md
│   ├── 11_ONBOARDING.md
│   ├── 12_CHANGELOG.md
│   └── 13_VERCEL_SUPABASE_MIGRATION.md
├── node_modules/                # Dependencies (gitignored)
├── prisma/
│   ├── schema.prisma            # Single source of truth for DB schema
│   ├── seed.ts                  # Initial seed data (states, sample senators/bills)
│   ├── seed-governors.mjs       # Governor seed script (uses DIRECT_URL)
│   └── seed-elections.mjs       # Election + deadline seed script
├── public/
│   ├── data/                    # Static data files
│   ├── images/                  # Static images
│   └── favicon.svg              # Site favicon
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API route handlers
│   │   │   ├── agencies/route.ts
│   │   │   ├── ai/
│   │   │   │   ├── analyze-bill/route.ts
│   │   │   │   └── analyze-candidate/route.ts
│   │   │   ├── bills/route.ts
│   │   │   ├── candidates/route.ts
│   │   │   ├── cron/            # 13 cron job routes
│   │   │   │   ├── analyze-bills/route.ts
│   │   │   │   ├── analyze-candidates/route.ts
│   │   │   │   ├── analyze-cases/route.ts
│   │   │   │   ├── send-digest/route.ts
│   │   │   │   ├── sync-bills/route.ts
│   │   │   │   ├── sync-campaign-finance/route.ts
│   │   │   │   ├── sync-elections/route.ts
│   │   │   │   ├── sync-local-meetings/route.ts
│   │   │   │   ├── sync-members/route.ts
│   │   │   │   ├── sync-pac-contributions/route.ts
│   │   │   │   ├── sync-scotus/route.ts
│   │   │   │   ├── sync-voter-info/route.ts
│   │   │   │   └── sync-votes/route.ts
│   │   │   ├── district-lookup/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── local/
│   │   │   │   ├── meeting/[id]/route.ts
│   │   │   │   ├── meetings/route.ts
│   │   │   │   ├── meetings/submit/route.ts
│   │   │   │   ├── municipality/route.ts
│   │   │   │   └── template/route.ts
│   │   │   ├── pac-recipients/route.ts
│   │   │   ├── polling-places/route.ts
│   │   │   ├── scotus/
│   │   │   │   ├── cases/route.ts
│   │   │   │   └── justices/route.ts
│   │   │   ├── search/route.ts
│   │   │   ├── subscribe/
│   │   │   │   ├── demographics/route.ts
│   │   │   │   ├── route.ts
│   │   │   │   └── verify/route.ts
│   │   │   └── unsubscribe/route.ts
│   │   ├── local/               # Local government pages
│   │   │   ├── page.tsx
│   │   │   ├── rules/page.tsx
│   │   │   ├── templates/page.tsx
│   │   │   ├── city/[id]/page.tsx
│   │   │   └── meeting/[id]/page.tsx
│   │   ├── state/[stateAbbr]/   # State hub pages
│   │   │   ├── page.tsx
│   │   │   ├── senators/page.tsx
│   │   │   ├── representatives/page.tsx
│   │   │   ├── governor/page.tsx
│   │   │   ├── bills/page.tsx
│   │   │   ├── bills/[billId]/page.tsx
│   │   │   ├── elections/page.tsx
│   │   │   ├── voter-info/page.tsx
│   │   ├── judicial/            # SCOTUS pages
│   │   │   ├── page.tsx
│   │   │   ├── cases/[...slug]/page.tsx
│   │   │   └── justices/[slug]/page.tsx
│   │   ├── candidate/[candidateId]/  # Candidate pages
│   │   │   └── page.tsx
│   │   ├── compare/             # Candidate comparison
│   │   │   └── page.tsx
│   │   ├── agencies/            # Federal agency directory
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── polling-places/      # Polling place finder
│   │   │   └── page.tsx
│   │   ├── about/               # About page
│   │   ├── contact/             # Contact page
│   │   ├── privacy/             # Privacy policy
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css          # Tailwind v4 + custom properties
│   │   ├── providers.tsx        # TanStack Query provider
│   │   ├── sitemap.ts           # Dynamic sitemap
│   │   ├── robots.ts            # robots.txt
│   │   ├── error.tsx            # Global error boundary
│   │   ├── not-found.tsx        # 404 page
│   │   # loading.tsx removed — root Suspense boundary prevented 404 status codes
│   ├── components/
│   │   ├── ui/                  # Reusable atomic UI components
│   │   │   ├── AiDisclaimer.tsx
│   │   │   ├── BillStatusBadge.tsx
│   │   │   ├── CandidateCard.tsx
│   │   │   ├── DataSourceBadge.tsx
│   │   │   ├── PartyBadge.tsx
│   │   │   ├── PolicyAccordion.tsx
│   │   │   ├── RiderAlertBadge.tsx
│   │   │   └── StateSelector.tsx
│   │   ├── layout/              # Header, Footer, Navigation
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Navigation.tsx
│   │   ├── features/            # Page-specific feature components
│   │   │   ├── AnimatedCards.tsx
│   │   │   ├── AnimatedSection.tsx
│   │   │   ├── BallotAddressInput.tsx
│   │   │   ├── BillDetailTabs.tsx
│   │   │   ├── BillsFilterBar.tsx
│   │   │   ├── CandidateTabs.tsx
│   │   │   ├── CompareTable.tsx
│   │   │   ├── DemographicSurveyModal.tsx
│   │   │   ├── DistrictFinder.tsx
│   │   │   ├── FederalAgenciesSection.tsx
│   │   │   ├── HomepageLinks.tsx
│   │   │   ├── PacRecipientsTable.tsx
│   │   │   ├── PolicyAccordion.tsx
│   │   │   ├── PollingPlaceFinder.tsx
│   │   │   ├── StateDetector.tsx
│   │   │   ├── StateRequiredBanner.tsx
│   │   │   ├── SubscribeBottomBar.tsx
│   │   │   ├── SubscribeForm.tsx
│   │   │   └── USStateMap.tsx
│   │   └── seo/                 # JSON-LD structured data
│   │       └── JsonLd.tsx
│   ├── data/
│   │   └── us-states.ts         # SVG path data for interactive map
│   ├── hooks/
│   │   └── useUserState.ts      # Cookie-based state persistence
│   ├── lib/
│   │   ├── ai/
│   │   │   └── claude-client.ts # Anthropic Claude integration
│   │   ├── email/
│   │   │   ├── digest-template.ts
│   │   │   └── verification-template.ts
│   │   ├── local/
│   │   │   └── legistar-client.ts # Granicus/Legistar API wrapper
│   │   ├── agencies.ts          # Static agency catalog
│   │   ├── auth.ts              # Cron auth helper (timingSafeEqual)
│   │   ├── db.ts                # Singleton PrismaClient
│   │   ├── fec.ts               # FEC / OpenFEC helpers
│   │   ├── pac-catalog.ts       # PAC metadata catalog
│   │   ├── rate-limit.ts        # Redis rate limiter
│   │   ├── resend.ts            # Resend email client
│   │   ├── sanitize.ts          # sanitize-html wrapper (avoids ESM/CJS crash in serverless)
│   │   └── utils.ts             # General utilities (cn, formatters)
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types & enums
│   └── middleware.ts            # Next.js middleware (rate limiting + auth)
├── .env                         # Local env vars (gitignored)
├── .env.example                 # Env var template
├── .env.production              # Production overrides (gitignored)
├── .gitignore
├── AGENTS.md                    # Agent instructions for AI coding assistants
├── README.md                    # Human-readable project overview
├── SECURITY.md                  # Security policy
├── next-env.d.ts                # Next.js TypeScript declarations
├── next.config.mjs              # Next.js config (standalone, security headers)
├── package.json
├── package-lock.json
├── postcss.config.mjs           # PostCSS config (Tailwind v4)
└── tsconfig.json                # TypeScript configuration
```

---

## Important Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Security headers, image remotePatterns |
| `postcss.config.mjs` | Tailwind CSS v4 PostCSS plugin |
| `tsconfig.json` | Strict TypeScript, `@/*` path alias to `./src/*` |
| `prisma/schema.prisma` | Database schema — single source of truth |
| `vercel.json` | Vercel deploy config + cron job schedules |
| `.env.example` | Template for all environment variables |
| `.deprecated/docker-compose.yml` | VPS services (Postgres, Redis, nginx, certbot) |
| `.deprecated/Dockerfile` | Multi-stage Node 22 Alpine build (VPS) |
| `.deprecated/nginx/nginx.conf` | Reverse proxy, gzip, rate-limit zones (VPS) |
| `.deprecated/nginx/default.conf` | Server blocks, SSL configuration (VPS) |

---

## Package.json Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev --turbopack` | Local development with Turbopack |
| `postinstall` | `prisma generate` | Auto-generate Prisma client after install |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | ESLint |
| `db:push` | `prisma db push` | Push schema to database |
| `db:seed` | `npx tsx prisma/seed.ts` | Run seed script |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI |

---

## Path Aliases

Configured in `tsconfig.json`:

| Alias | Maps To |
|-------|---------|
| `@/*` | `./src/*` |

Usage examples:
- `@/lib/db` → `src/lib/db.ts`
- `@/components/ui/PartyBadge` → `src/components/ui/PartyBadge.tsx`
- `@/hooks/useUserState` → `src/hooks/useUserState.ts`

---

## Deprecation History

VPS-era files (Docker, Nginx, deployment scripts, under-construction pages) and IDE
config folders (`.claude/`, `.agents/`, `.continue/`) have been moved to
`.deprecated/`. These are gitignored and retained only for reference during the
transition back to Vercel + Supabase hosting.
