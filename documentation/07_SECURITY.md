# 07 — Security

> **Last Updated:** 2026-06-05

---

## Authentication Strategy

### No Traditional User Auth
- There is **no login system**, no passwords, and no session cookies for end users.
- "Users" are identified by email address only (`User` table) for bookmarks.
- Subscribers (`Subscriber` table) are identified by email + verification token.

### Cron / AI Route Authentication
- `/api/ai/*` requires `Authorization: Bearer <CRON_SECRET>`.
- `/api/cron/*` uses `verifyCronSecret(request)`, which checks the Bearer header first, then falls back to `?secret=<CRON_SECRET>` query param (useful for Vercel Cron Jobs). All 13 cron route handlers enforce this.
- Two implementations of constant-time comparison:
  1. `src/middleware.ts`: Custom `timingSafeCompare()` using XOR (works in Edge Runtime; masks length differences)
  2. `src/lib/auth.ts`: `verifyCronSecret()` using Node's `timingSafeEqual` (performs a dummy comparison on length mismatch to prevent length leakage)
- **Dev bypass:** `ALLOW_MANUAL_CRON=true` + `?manual=true` allows local development without a token. **Never enable in production.**

---

## Authorization / RBAC

There is **no RBAC** in this application. All public pages and API routes are unauthenticated.

| Role | Capabilities |
|------|-------------|
| Public visitor | Read all pages, search, subscribe |
| Cron caller (with secret) | Trigger sync jobs, AI analysis |

---

## Rate Limiting

**Implementation:** `src/lib/rate-limit.ts` (Redis-backed fixed-window counter)

| Route Type | Limit | Window | Identifier |
|------------|-------|--------|------------|
| Public API (`/api/*`) | 60 requests | 60 seconds | `pub:${ip}` |
| Protected API (`/api/cron/*`, `/api/ai/*`) | 300 requests | 60 seconds | `auth:${ip}` |
| Subscribe (`/api/subscribe` POST) | 5 requests | 60 seconds | `sub:${ip}` |

- **Fail-open:** If Redis is unavailable, all requests are allowed.
- IP detection order: `cf-connecting-ip` → `x-vercel-forwarded-for` → `x-real-ip` → rightmost entry of `x-forwarded-for` → `"unknown"`


---

## Security Headers

Set in `next.config.mjs` and applied to all routes:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| ~~`X-XSS-Protection`~~ | ~~`1; mode=block`~~ *(removed — deprecated and can introduce vulnerabilities)* |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(self), camera=(), microphone=(), payment=(), usb=()` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://theunitedstates.io https://bioguide.congress.gov https://*.oyez.org; connect-src 'self' https://api.bigdatacloud.net https://ipapi.co https://api.usaspending.gov; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` |

Nginx headers are replaced by Next.js `headers()` config in `next.config.mjs`.

---

## Input Sanitization

- **`sanitize-html`** (pure-JS `htmlparser2`) is used for rendering external HTML.
- **File:** `src/lib/sanitize.ts`
- Replaced `isomorphic-dompurify` on 2026-06-05 because `jsdom` → `parse5@8` (ESM-only) crashed in Vercel serverless with `ERR_REQUIRE_ESM`.
- Allowed tags: `p`, `a`, `ul`, `li`, `ol`, `br`, `strong`, `em`, `h1`–`h6`, `blockquote`, `span`, `div`, `pre`, `code`, `table`, `thead`, `tbody`, `tr`, `td`, `th`
- Allowed attributes: `href`, `rel`, `class`, `title` (`target` intentionally removed to prevent tabnabbing)
- Applied to: Oyez case HTML (`question`, `factsOfTheCase`, `conclusion`), justice biographies, external agency descriptions

---

## Docker Hardening

**File:** `.deprecated/Dockerfile`

- Multi-stage build (builder + runner)
- **Non-root user:** `nextjs` (uid 1001) in runner stage
- Minimal Alpine Linux base image
- Only runtime dependencies installed (`openssl`, `curl`)
- Health check endpoint: `/api/health`

---

## VPS Hardening

**File:** `.deprecated/scripts/vps-setup.sh`

- UFW firewall configuration
- fail2ban for brute-force protection
- unattended-upgrades for automatic security patches
- SSH key-only authentication (password login disabled)
- Docker log rotation

---

## Data Protection

- **No PII beyond email** is required for core functionality.
- **Demographic data** is optional and collected only after explicit subscription verification.
- **Environment variables** (`.env`) are never committed — see `.gitignore`.
- **Database** and **Redis** bind to `127.0.0.1` only — no public exposure.

---

## Supabase-Specific Security Considerations (Migration)

When migrating to Supabase, enable these protections:

### Row Level Security (RLS)
- **Enable RLS on every table in the `public` schema.** Tables in exposed schemas are reachable through the Data API.
- Create policies matching the actual access model:
  - Public read access for `State`, `Candidate`, `Bill`, `CourtCase`, `Justice`, `Election`
  - No public write access for any table (all writes go through API routes with `CRON_SECRET`)
  - `Subscriber` table: allow reads only by verification token, not by generic `auth.uid()`

### Auth
- **Do not use Supabase Auth for this app** unless adding a login system.
- If Auth is added later:
  - Store authorization data in `app_metadata`, NOT `user_metadata` (user-editable and unsafe for RLS)
  - Remember that deleting a user does NOT invalidate existing access tokens
  - Never expose the `service_role` key in public clients

### Views
- **Views bypass RLS by default.** Use `CREATE VIEW ... WITH (security_invoker = true)` (Postgres 15+) or protect views by revoking access from `anon` and `authenticated` roles.

### Storage
- Not currently used. If images are uploaded later:
  - Storage upsert requires INSERT + SELECT + UPDATE policies
  - Grant only needed permissions

---

## Error Sanitization

**Implementation:** `src/lib/api-error-handler.ts` + `src/lib/errors/`

- All API routes wrapped with `withErrorHandler` (public APIs) or `withCronErrorHandler` (cron jobs)
- Typed error hierarchy: `AppError` abstract base + 8 domain subclasses (`ValidationError`, `NotFoundError`, `DatabaseError`, `ExternalAPIError`, `RateLimitError`, `AuthenticationError`, `AIProcessingError`, `ServerError`)
- **NEVER exposed to clients:** raw error messages, stack traces, subsystem names ("Prisma", "Redis", "Claude", "Legistar"), internal codes (P2002), API keys, or file paths
- **Always logged server-side:** full details with `requestId` for traceability via `src/lib/error-logger.ts`
- Cron routes return HTTP 200 on failure to prevent Vercel infinite retry loops

## Known Limitations

1. **No CSRF protection** on API routes — not applicable since there are no state-changing authenticated user actions (only cron jobs use auth).
2. **No request signing** on webhooks — cron jobs are triggered by host-level HTTP calls; ensure cron sources are trusted.
3. **CSP allows `unsafe-inline`** for scripts and styles — required by Next.js inline chunks; review if stricter CSP is needed.
4. **Rate limit fail-open** — Redis downtime removes all rate limiting; monitor Redis health.
5. **Rate limiter atomicity** — Uses `set nx` + `incr` to avoid race conditions between key creation and TTL assignment.
