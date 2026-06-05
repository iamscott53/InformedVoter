# 12 — Changelog

> **Last Updated:** 2026-06-05

---

## Version History

### Current State (as of 2026-06-05)

**Mature MVP** — All core feature areas are built and deployed.

#### Added
- Interactive US map on homepage (`USStateMap`)
- State hub pages with senators, representatives, governor, bills, elections, voter info
- Candidate profiles with policy positions, campaign finance, and sponsored bills
- Side-by-side candidate comparison (`/compare`)
- Federal bill tracking with AI-generated summaries and rider detection
- SCOTUS dashboard with case details, justice profiles, and financial disclosures
- Federal agency directory with budget data from USAspending.gov
- Local government hub: city search, meeting listings, agenda items, AI speaking templates
- First Amendment speaking rules page (`/local/rules`)
- Template library for public comment (`/local/templates`)
- Email subscription system with verification, topic selection, and optional demographic survey
- PAC recipient tracking and committee detail pages
- Polling place finder
- Voter information hub with registration deadlines and state-specific requirements
- 13 automated cron sync jobs (members, bills, votes, SCOTUS, finance, elections, voter info, PACs, local meetings, digests)
- Redis-backed rate limiting with tiered limits
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Multi-stage Dockerfile with non-root runtime user
- Docker Compose production stack (Postgres, Redis, Nginx, Certbot)
- VPS deployment scripts with hardening (UFW, fail2ban, unattended-upgrades)
- Standalone maintenance mode (`under-construction/`)

#### Changed
- Migrated from Vercel hosting to self-hosted Docker Compose on Ubuntu 24.04 VPS
- Upgraded to Next.js 16 with App Router and Turbopack
- Upgraded to Tailwind CSS v4
- Upgraded to React 19
- Switched from Upstash Redis to self-hosted Redis 7

#### Infrastructure
- Nginx reverse proxy with SSL termination, gzip, and rate-limit zones
- Let's Encrypt SSL via Certbot with auto-renewal
- PostgreSQL 16 with logging and connection tuning
- Redis 7 with AOF persistence and LRU eviction
- Health check endpoint (`/api/health`) for Docker and load balancers

---

## Completed Migration (Vercel + Supabase) — 2026-05-30

## Post-Migration Fixes — 2026-06-05

### Fixed
- **Database connection restored** — `DATABASE_URL` pooler endpoint corrected (`aws-0` → `aws-1`). All data APIs now return 200.
- **SCOTUS detail pages 500 error** — Replaced `isomorphic-dompurify` with `sanitize-html` (pure JS, no DOM). Justice and case detail pages now load correctly.
- **Documentation sync** — Removed non-existent `state-legislature` route from AGENTS.md and 4 documentation files.
- **Security audit deployed** — All 18 security hardening measures now active in production (timing-safe auth, prompt injection defense, rate limiter atomicity, SSRF hardening, XSS/tabnabbing protections, info disclosure minimization, input validation).
- **UAT completed** — Full acceptance testing against production. 179 cases, 175 passes, 0 real failures. Report saved to `UAT_REPORT.md`.
- **3 UAT issues fixed:**
  - `/api/pac-recipients` now supports list-all mode (no `committeeIds` required)
  - `/local/city/[id]` and `/state/[stateAbbr]` now return proper 404 for invalid IDs
  - `/api/unsubscribe` returns 400 for invalid tokens (was 200)

### Changed
- `src/lib/sanitize.ts` — Now uses `sanitize-html` instead of `isomorphic-dompurify`
- `package.json` — Removed `isomorphic-dompurify`, added `sanitize-html` + `@types/sanitize-html`
- `.env.example` — Updated with correct pooler username format (`postgres.REF`) and `?pgbouncer=true`
- `.creds/creds.md` — Fixed pooler endpoint to `aws-1-us-east-1`
- `src/app/api/pac-recipients/route.ts` — `committeeIds` now optional; discover mode caps at 50 committees
- `src/app/api/unsubscribe/route.ts` — `htmlPage()` accepts status param; invalid tokens return 400
- `src/app/local/city/[id]/page.tsx` — `notFound()` called in `generateMetadata` for missing cities

### Removed
- `src/app/loading.tsx` — Root loading spinner (Next.js Suspense boundary prevented 404 status codes)
- `src/app/state/[stateAbbr]/loading.tsx` — State dashboard skeleton (same reason)

### Added
- `UAT_REPORT.md` — Comprehensive UAT report with remediation plan
- `uat-test.mjs` + `uat-test-phase2.mjs` — Reusable automated UAT scripts

The project has returned to its original hosting stack. See `13_VERCEL_SUPABASE_MIGRATION.md` for details.

Completed changes:
- **Removed:** `Dockerfile`, `docker-compose.yml`, `nginx/`, `scripts/`, `under-construction/` moved to `.deprecated/` (gitignored)
- **Database:** Prisma schema updated with `directUrl` for Supabase; 4 new local gov tables created; RLS policies applied
- **Cache:** Upstash Redis database `informedvoter-redis` provisioned in `us-east-1`
- **Config:** `vercel.json` created with 13 cron schedules; `next.config.mjs` updated for Vercel
- **Auth:** All `/api/cron/*` routes now enforce `verifyCronSecret(request)` (Bearer header or `?secret=` query param). `/api/ai/*` still requires Bearer token. Timing-attack protections hardened in both middleware and auth helper.
- **Env:** `DATABASE_URL`, `DIRECT_URL`, `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`, `CRON_SECRET` configured in `.env`

---

## Known Issues & TODOs

### Testing
- **No automated test suite.** Add Jest/Vitest for unit tests and Playwright for E2E.

### Data Sync
- Local meeting data is fragmented; coverage requires building adapters for multiple platforms (Legistar, CivicPlus, etc.).
- Some external API keys are optional — features degrade gracefully when missing.

### Migrations
- No formal migration system in use. Schema updates rely on `prisma db push`.
- Risky schema changes should be backed by PostgreSQL dumps before deployment.

### CI/CD
- Deploys via Vercel Git integration (push to `main`).
- Migration to Vercel will enable Git-based auto-deployment.

### Monitoring
- No external observability (Datadog, Sentry, etc.) configured.
- Docker health checks and nginx logs are the primary monitoring tools (VPS).

### Security
- **RLS enabled** — all public tables now have SELECT policies; PII tables default-deny.
- **No user authentication** — the app is fully public. If auth is added later, use Supabase Auth with proper RLS policies.

---

## Documentation History

| Date | Change |
|------|--------|
| 2026-06-05 | UAT completed; sanitize-html fix deployed; DB connection restored; docs synced |
| 2026-06-05 | Full security audit deployed (18 hardening measures) |
| 2026-05-30 | Comprehensive documentation updated with deep codebase analysis |
| 2026-05-30 | Added Vercel + Supabase migration plan and deployment documentation |
| 2026-05-30 | Migration completed: Supabase tables created, RLS applied, Upstash Redis provisioned, middleware fixed, docs updated |
