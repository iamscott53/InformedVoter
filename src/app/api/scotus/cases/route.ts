import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────
// GET /api/scotus/cases?term=2024&status=DECIDED
// ─────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const termParam = searchParams.get("term")?.trim();
    const statusParam = searchParams.get("status")?.trim().toUpperCase();

    const where: Record<string, unknown> = {};

    if (termParam) {
      const term = parseInt(termParam, 10);
      if (!Number.isInteger(term) || term < 1790 || term > 2100) {
        return Response.json(
          { error: "Invalid term. Must be a valid year." },
          { status: 400 }
        );
      }
      where.term = term;
    }

    if (statusParam) {
      if (!["GRANTED", "ARGUED", "DECIDED"].includes(statusParam)) {
        return Response.json(
          { error: "Invalid status. Must be GRANTED, ARGUED, or DECIDED." },
          { status: 400 }
        );
      }
      where.status = statusParam;
    }

    const cases = await prisma.courtCase.findMany({
      where,
      select: {
        id: true,
        oyezId: true,
        name: true,
        docketNumber: true,
        term: true,
        dateArgued: true,
        dateDecided: true,
        question: true,
        aiSummary: true,
        decisionDirection: true,
        majorityVotes: true,
        minorityVotes: true,
        justiaUrl: true,
        status: true,
      },
      orderBy: [{ dateDecided: "desc" }, { dateArgued: "desc" }],
      take: 50,
    });

    return Response.json({ cases });
  } catch (error) {
    console.error("[scotus/cases] Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
