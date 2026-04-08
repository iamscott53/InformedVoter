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

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl;
  const ip = getClientIP(request);

  const isProtected =
    pathname.startsWith("/api/ai/") || pathname.startsWith("/api/cron/");

  if (isProtected) {
    // ── Dev manual trigger ──────────────────────────────────────────────
    // Requires ALLOW_MANUAL_CRON=true explicitly set in .env.
    // Replaces the old NODE_ENV check which could fire in a misconfigured
    // staging environment.
    if (
      process.env.ALLOW_MANUAL_CRON === "true" &&
      pathname.startsWith("/api/cron/") &&
      searchParams.get("manual") === "true"
    ) {
      return NextResponse.next();
    }

    // ── Bearer-token auth ───────────────────────────────────────────────
    const cronSecret = process.env.CRON_SECRET?.trim();
    if (!cronSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate-limit authenticated routes ─────────────────────────────────
    const { allowed, retryAfter } = await checkRateLimit(
      `auth:${ip}`,
      PROTECTED_LIMIT,
      WINDOW_SEC
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
