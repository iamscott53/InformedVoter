# 01 — Project Overview

> **Last Updated:** 2026-06-05

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
| Framework | Next.js | 16.2+ | App Router, Turbopack in dev |
| Language | TypeScript | 5.9+ | Strict mode, `@/*` path aliases |
| Styling | Tailwind CSS | v4 | `@import "tailwindcss"` in globals.css |
| ORM | Prisma | 5.22 | PostgreSQL-only schema + client generation |
| Database | Supabase PostgreSQL | 16 | Managed, with connection pooler |
| Cache / Rate-limit | Upstash Redis | — | @upstash/redis REST client; edge-compatible |
| AI | Anthropic SDK | ^0.85 | `claude-haiku-4-5` (cheap), `claude-sonnet-4-5` (complex) |
| State Management | TanStack Query | v5 | React Query for server-state caching |
| Email | Resend | ^6.10 | Verification + digest emails |
| Icons | Lucide React | ^0.577 | Icon library |
| Animations | Framer Motion | ^12.38 | Page transitions & micro-interactions |
| Hosting | Vercel | — | Serverless, Edge CDN, image optimization, cron jobs |

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
- **Hosting:** Vercel (serverless)
- **Database:** Supabase PostgreSQL (managed)
- **Cache:** Upstash Redis
- **Cron:** Vercel Cron Jobs (`vercel.json`)
- **Analytics:** @vercel/analytics

### Migration History
Originally on Vercel + Supabase → moved to VPS/Docker → returned to Vercel + Supabase. VPS files archived in `.deprecated/`.

---

## Live URLs

| Environment | URL | Notes |
|-------------|-----|-------|
| Production | `https://knowyourgov.us` | Vercel + Supabase + Upstash |
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
- **Hosted on Vercel + Supabase** — Migration from VPS completed.

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
