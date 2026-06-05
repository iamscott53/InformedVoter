# 10 — Testing

> **Last Updated:** 2026-06-05

---

## Automated Testing

**There is currently no automated test suite.**

The project has no configuration for:
- Jest
- Vitest
- Playwright
- Cypress
- Any other test runner

If tests are added, place the configuration at the project root and update this file.

---

## UAT (User Acceptance Testing)

A full UAT was completed on 2026-06-05 against the production environment.
- **179 test cases** executed (Phase 1: 129, Phase 2: 50)
- **175 passed**, **0 failures**, **4 warnings** (data availability only)
- **5 issues fixed during testing**, **0 active issues remaining**
- See `UAT_REPORT.md` for the complete report with remediation plan

### Automated Test Scripts

Reusable Node.js test scripts are committed to the repo:
- `uat-test.mjs` — Phase 1: smoke tests for all pages, APIs, forms, security headers
- `uat-test-phase2.mjs` — Phase 2: deep-dive tests for images, CORS, structured data, SEO, rate limiting, edge cases

Run with: `node uat-test.mjs` and `node uat-test-phase2.mjs`

---

## Manual Testing Checklist

### Core Pages

| Page | Test | Expected Result |
|------|------|-----------------|
| `/` | Load homepage | US map renders, state selector works, `AnimatedCards` animate |
| `/state/CA` | Navigate to California hub | Senators, reps, governor cards load with photos and badges |
| `/candidate/1` | Open candidate profile | `CandidateTabs` switch, finance data loads with cycle selector |
| `/bills` | Filter bills | Filter by status/chamber updates listing, pagination works |
| `/judicial` | Load SCOTUS dashboard | Cases and justices display, gift count shows |
| `/local` | Search city | `Municipality` results appear, meeting submission form works |
| `/agencies` | View agencies | Agency cards render, category filters work |
| `/compare` | Compare candidates | Side-by-side table loads, candidate selection works |
| `/state/CA/bills` | State bills | URL filter bar updates query params, results filter correctly |
| `/state/CA/voter-info` | Voter info | Deadline cards render, action links work |

### API Endpoints

| Endpoint | Test | Expected Result |
|----------|------|-----------------|
| `GET /api/health` | curl / browser | `{ status: "ok" }` |
| `GET /api/search?q=tax` | Search | Returns relevant bills and candidates |
| `GET /api/bills?status=SIGNED` | Filter | Only signed bills returned |
| `GET /api/candidates?state=CA` | Filter | Only CA candidates returned, capped at 200 |
| `POST /api/subscribe` | Submit email | Returns success, sends verification email via Resend |
| `GET /api/subscribe/verify?token=xxx` | Verify | Sets `verified = true`, returns HTML confirmation |
| `POST /api/cron/sync-bills?manual=true` | With `ALLOW_MANUAL_CRON=true` | Syncs bills (dev only) |
| `GET /api/agencies` | Load | Returns agency catalog with budget data from USAspending.gov |
| `GET /api/scotus/cases` | Load | Returns SCOTUS cases |
| `GET /api/local/municipality?q=Seattle` | Search | Returns Seattle municipality with meetings |

### Cron Jobs

Trigger each cron route locally with `?manual=true` (requires `ALLOW_MANUAL_CRON=true`):

- `/api/cron/sync-members`
- `/api/cron/sync-bills`
- `/api/cron/sync-votes`
- `/api/cron/analyze-bills`
- `/api/cron/analyze-candidates`
- `/api/cron/analyze-cases`
- `/api/cron/sync-scotus`
- `/api/cron/sync-campaign-finance`
- `/api/cron/sync-elections`
- `/api/cron/sync-voter-info`
- `/api/cron/sync-pac-contributions`
- `/api/cron/sync-local-meetings`
- `/api/cron/send-digest`

Verify `DataSyncLog` table after each run for success/failure records.

### Interactive Features

| Feature | Test Steps |
|---------|------------|
| State selection | Click US map → verify navigation to `/state/[abbr]` → verify cookie set → verify header links prefixed |
| Bill filters | Change chamber dropdown → verify URL updates → verify results refresh |
| Candidate comparison | Select 2 candidates → verify table renders → expand policy row |
| Local meeting template | Navigate to meeting → click "Generate Template" → verify AI response → copy to clipboard |
| Email subscription | Enter email → submit → verify Resend email received → click verify link → check `Subscriber.verified` |
| Demographic survey | After subscription, verify modal opens → complete 3 steps → verify DB update |
| Polling place finder | Enter address → verify Google Civic API response → verify polling locations display |

---

## Test Accounts / Demo Data

- No dedicated test accounts exist.
- Use `npm run db:seed` to populate initial data (50 states, sample senators, sample bills, CA/TX voter info).
- Use `npx tsx prisma/seed-governors.mjs` for all 50 governors.
- Use `npx tsx prisma/seed-elections.mjs` for 2026 elections.
- For email testing, use a personal email address with the subscribe flow.

---

## Browser Compatibility

- **Target:** Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- **Not tested on:** Internet Explorer, legacy mobile browsers
- **Accessibility:** Skip-to-content link, focus-visible outlines, semantic HTML, `aria-expanded`, `aria-label`, keyboard navigation on US map

---

## Debugging Tips

### Prisma
```bash
npm run db:studio    # Visual database inspector
```

### Redis (Upstash)
```bash
# Check Redis connectivity via REST API
curl "https://your-db.upstash.io/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_TOKEN"
```

### Logs (Vercel)
- View logs in Vercel Dashboard → Project → Logs
- Or use Vercel CLI: `vercel logs --json`

### Local Dev
```bash
npm run dev          # Turbopack dev server with hot reload
```

### Rate Limiting
- If APIs return 429 unexpectedly, check `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` env vars
- In development, Redis is optional — rate limiting fails open if Redis is unavailable

### Supabase (After Migration)
```bash
# Connect to Supabase via psql
psql "postgresql://postgres.[project]:[password]@db.[project].supabase.co:5432/postgres"

# Or use Supabase Dashboard SQL Editor
```

---

## Performance Notes

- Standalone Next.js build minimizes server startup time (VPS only).
- On Vercel, serverless functions cold-start ~100-300ms.
- Prisma connection pool: default 5-10 connections.
- Supabase connection pooler (PgBouncer): use `?pgbouncer=true` in `DATABASE_URL`.
- Redis rate-limit keys expire automatically.
- Nginx gzip compression enabled for static assets (VPS only); Vercel handles compression automatically.
