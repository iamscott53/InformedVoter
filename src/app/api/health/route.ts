import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────
// GET /api/health
// Simple health check for load balancers and monitoring
// ─────────────────────────────────────────────

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    app: "ok",
    database: "ok",
  };

  let status = 200;

  try {
    // Lightweight DB check
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    checks.database = "error";
    status = 503;
  }

  return NextResponse.json(
    {
      status: status === 200 ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
