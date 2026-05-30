# 12 — Changelog

> **Last Updated:** 2026-05-30

---

## Version History

### Current State (as of 2026-05-30)

**Mature MVP** — All core feature areas are built and deployed.

#### Added
- Interactive US map on homepage (`USStateMap`)
- State hub pages with senators, representatives, governor, bills, elections, voter info, state legislature
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

## Planned Migration (Vercel + Supabase)

The project is returning to its original hosting stack. See `13_VERCEL_SUPABASE_MIGRATION.md` for the full migration plan.

High-level changes:
- **Remove:** Dockerfile, docker-compose.yml, nginx/, under-construction/, VPS scripts
- **Modify:** Prisma schema (add `directUrl`), rate-limit.ts (Upstash support), middleware.ts (Vercel IP headers)
- **Create:** `vercel.json` with cron schedules
- **Add:** Supabase RLS policies on all tables
- **Update:** Environment variables for Supabase + Upstash

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
- No automated deployment pipeline. Deploys are manual via `scripts/deploy.sh` (VPS).
- Migration to Vercel will enable Git-based auto-deployment.

### Monitoring
- No external observability (Datadog, Sentry, etc.) configured.
- Docker health checks and nginx logs are the primary monitoring tools (VPS).

### Security
- **RLS not enabled** — current self-hosted PostgreSQL has no RLS. Supabase migration requires enabling RLS on all tables.
- **No user authentication** — the app is fully public. If auth is added later, use Supabase Auth with proper RLS policies.

---

## Documentation History

| Date | Change |
|------|--------|
| 2026-05-30 | Comprehensive documentation updated with deep codebase analysis |
| 2026-05-30 | Added Vercel + Supabase migration plan and deployment documentation |
