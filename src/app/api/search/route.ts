import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────
// GET /api/search?q=<term>
// Full-text search across bills (title) and candidates (name).
// Returns { bills: [...], candidates: [...] }
// ─────────────────────────────────────────────

const MAX_RESULTS_PER_TYPE = 10;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length === 0) {
      return Response.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    if (q.length < 2) {
      return Response.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Run both searches in parallel
    const [bills, candidates] = await Promise.all([
      prisma.bill.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { shortTitle: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          externalId: true,
          title: true,
          shortTitle: true,
          chamber: true,
          status: true,
          introducedDate: true,
          lastActionDate: true,
          executiveSummary: true,
          sponsorId: true,
          fullTextUrl: true,
          congressGovUrl: true,
          subjects: true,
          stateId: true,
        },
        orderBy: { introducedDate: "desc" },
        take: MAX_RESULTS_PER_TYPE,
      }),

      prisma.candidate.findMany({
        where: {
          name: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          party: true,
          photoUrl: true,
          biography: true,
          websiteUrl: true,
          officeType: true,
          district: true,
          isIncumbent: true,
          stateId: true,
          state: {
            select: { id: true, name: true, abbreviation: true, fipsCode: true },
          },
        },
        orderBy: { name: "asc" },
        take: MAX_RESULTS_PER_TYPE,
      }),
    ]);

    return Response.json({ bills, candidates });
  } catch (error) {
    console.error("[search] Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
