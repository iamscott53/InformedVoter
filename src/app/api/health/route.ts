import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler } from "@/lib/api-error-handler";

// ─────────────────────────────────────────────
// GET /api/health
// Simple health check for load balancers and monitoring.
// Returns minimal info publicly; detailed checks are logged server-side.
// ─────────────────────────────────────────────

export const GET = withErrorHandler(async () => {
  let dbOk = true;

  try {
    // Lightweight DB check
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? 200 : 503;

  return NextResponse.json(
    { status: dbOk ? "ok" : "degraded" },
    { status }
  );
}, { route: "GET /api/health" });
