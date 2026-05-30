import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// ─────────────────────────────────────────────
// Rate-limit tiers (requests per 60-second window)
// ─────────────────────────────────────────────
const PUBLIC_LIMIT    = 60;   // /api/search, /api/bills, etc.
const PROTECTED_LIMIT = 300;  // /api/ai/* and /api/cron/*
const WINDOW_SEC      = 60;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function tooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/**
 * Constant-time string comparison using XOR.
 * Prevents timing attacks that leak secrets character by character.
 * Works in Edge Runtime (no Node.js crypto required).
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl;
  const ip = getClientIP(request);

  const isCron    = pathname.startsWith("/api/cron/");
  const isAi      = pathname.startsWith("/api/ai/");
  const isProtected = isAi || isCron;

  if (isProtected) {
    // ── Dev manual trigger (bypasses auth for local testing) ────────────
    // Requires ALLOW_MANUAL_CRON=true explicitly set in .env.
    // NEVER set this in production.
    if (
      process.env.ALLOW_MANUAL_CRON === "true" &&
      isCron &&
      searchParams.get("manual") === "true"
    ) {
      return NextResponse.next();
    }

    // ── AI routes: require Bearer token (always) ────────────────────────
    if (isAi) {
      const cronSecret = process.env.CRON_SECRET?.trim();
      if (!cronSecret) {
        return NextResponse.json(
          { error: "Server misconfiguration" },
          { status: 500 }
        );
      }

      const authHeader = request.headers.get("Authorization");
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (!bearerToken || !timingSafeCompare(bearerToken, cronSecret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // ── Cron routes: no auth required ───────────────────────────────────
    // Vercel Cron Jobs cannot send custom headers or query params.
    // Cron routes are idempotent GETs; rate limiting is the protection.
    // Manual triggers in production can use ?secret=CRON_SECRET if desired.
    if (isCron) {
      const cronSecret = process.env.CRON_SECRET?.trim();
      const queryToken = searchParams.get("secret");
      if (cronSecret && queryToken && !timingSafeCompare(queryToken, cronSecret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // If no secret provided, allow through (Vercel Cron Jobs)
    }

    // ── Rate-limit protected routes ─────────────────────────────────────
    const { allowed, retryAfter } = await checkRateLimit(
      `auth:${ip}`,
      PROTECTED_LIMIT,
      WINDOW_SEC
    );
    if (!allowed) return tooManyRequests(retryAfter);
  } else if (pathname === "/api/subscribe" && request.method === "POST") {
    // ── Stricter rate limit on subscribe endpoint ───────────────────────
    const { allowed, retryAfter } = await checkRateLimit(
      `sub:${ip}`,
      5, // 5 requests per 60s
      60
    );
    if (!allowed) return tooManyRequests(retryAfter);
  } else {
    // ── Rate-limit public API routes ────────────────────────────────────
    const { allowed, retryAfter } = await checkRateLimit(
      `pub:${ip}`,
      PUBLIC_LIMIT,
      WINDOW_SEC
    );
    if (!allowed) return tooManyRequests(retryAfter);
  }

  return NextResponse.next();
}

export const config = {
  // Cover all API routes — rate limiting public, auth + rate limiting protected
  matcher: ["/api/:path*"],
};
