import { NextRequest, NextResponse } from "next/server";

// Protect these routes with Bearer token auth using CRON_SECRET
// /api/ai/* — AI analysis endpoints
// /api/cron/* — Cron sync endpoints

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // In development, allow ?manual=true bypass for cron routes
  if (process.env.NODE_ENV === "development") {
    if (pathname.startsWith("/api/cron/") && searchParams.get("manual") === "true") {
      return NextResponse.next();
    }
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET is not set" },
      { status: 401 },
    );
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token !== cronSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/ai/:path*", "/api/cron/:path*"],
};
