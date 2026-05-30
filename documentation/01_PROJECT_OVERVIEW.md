# 01 — Project Overview

> **Last Updated:** 2026-05-30

---

## What is InformedVoter?

**InformedVoter** (`https://knowyourgov.us`) is a nonpartisan US civic information platform — the "Wikipedia for government." It surfaces data about Congress, the Supreme Court, federal agencies, campaign finance, elections, and local government — explained in plain English, often with AI-generated summaries.

### Audience
- US citizens who want to understand their government without partisan spin
- Voters researching candidates, bills, and elections
- Grassroots activists attending local city council meetings
- Journalists and researchers tracking campaign finance and judicial disclosures

### Problem It Solves
Government data is fragmented, jargon-heavy, and difficult to navigate. InformedVoter aggregates disparate sources (Congress.gov, FEC, Oyez, CourtListener, Legistar) into a single, searchable, plain-English interface.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 16.2+ | App Router, standalone output, Turbopack in dev |
| Language | TypeScript | 5.9+ | Strict mode, `@/*` path aliases |
| Styling | Tailwind CSS | v4 | `@import "tailwindcss"` in globals.css |
| ORM | Prisma | 5.22 | PostgreSQL-only schema + client generation |
| Database | PostgreSQL | 16 | Self-hosted via Docker Compose |
| Cache / Rate-limit | Redis | 7 | ioredis client; fails open if unavailable |
| AI | Anthropic SDK | ^0.85 | `claude-haiku-4-5` (cheap), `claude-sonnet-4-5` (complex) |
| State Management | TanStack Query | v5 | React Query for server-state caching |
| Email | Resend | ^6.10 | Verification + digest emails |
| Icons | Lucide React | ^0.577 | Icon library |
| Animations | Framer Motion | ^12.38 | Page transitions & micro-interactions |
| Hosting | Docker Compose | — | Ubuntu 24.04 VPS: Nginx + Certbot + Postgres + Redis + Next.js |

---

## Deployment History

This project has been through two hosting configurations:

### Original Stack (pre-2026)
- **Hosting:** Vercel (Serverless)
- **Database:** Supabase Postgres (managed)
- **Cache:** Upstash Redis
- **Cron:** Vercel Cron Jobs (`vercel.json`)
- **Analytics:** Vercel Web Analytics

### Current Stack (2026)
- **Hosting:** Self-hosted VPS (Ubuntu 24.04) via Docker Compose
- **Database:** Self-hosted PostgreSQL 16
- **Cache:** Self-hosted Redis 7
- **Cron:** Host-level cron (crontab)
- **Reverse Proxy:** Nginx + Let's Encrypt

### Planned Migration
The project is returning to **Vercel + Supabase**. See `08_DEPLOYMENT.md` and `13_VERCEL_SUPABASE_MIGRATION.md` for the migration plan.

---

## Live URLs

| Environment | URL | Notes |
|-------------|-----|-------|
| Production (VPS) | `https://knowyourgov.us` | Self-hosted Docker stack |
| Original Vercel | `https://informed-voter.vercel.app` | Historical |
| Local Dev | `http://localhost:3000` | `npm run dev` with Turbopack |

---

## Repository Info

- **Local Path:** `c:\Shared\git\InformedVoter`
- **Primary Branch:** `main`
- **Deployment:** Vercel Git integration (current)

---

## Project Status

- **Mature MVP** — Core features are built and deployed.
- **No automated test suite** — Testing is entirely manual.
- **No formal migration system** — Schema changes via `prisma db push`.
- **Self-hosted** — Currently on VPS; migrating back to Vercel + Supabase.

---

## Feature Areas

1. **Federal Legislative** — Bill tracking, voting records, cosponsors, AI summaries, rider detection
2. **Judicial** — SCOTUS cases, justice profiles, financial disclosures, gift tracking
3. **Campaign Finance** — FEC integration, top donors, PAC contributions, expenditures, independent expenditures
4. **Elections & Voter Info** — State election dates, registration deadlines, polling locators, voter ID requirements
5. **Local Government** — City council meetings, agendas, AI speaking templates, First Amendment guides
6. **Email Subscriptions** — Topic-based digests with verification + optional demographic profiling
7. **Candidate Profiles** — Policy positions, finance summaries, comparison tool, voting records
8. **Federal Agencies** — Agency directory with live budget data from USAspending.gov
