import { prisma } from "@/lib/db";
import { analyzeCandidatePolicy } from "@/lib/ai/claude-client";
import { PolicyCategory, VoteChoice } from "@/types";

// ─────────────────────────────────────────────
// POST /api/ai/analyze-candidate
// Body: { candidateId: number, category: PolicyCategory }
//
// Fetches candidate data (including vote history), calls Claude for a
// balanced policy analysis, upserts the CandidatePolicy record, and
// returns the result.
// ─────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { candidateId, category } = body as {
      candidateId?: unknown;
      category?: unknown;
    };

    if (candidateId === undefined || candidateId === null) {
      return Response.json(
        { error: "'candidateId' is required in the request body" },
        { status: 400 }
      );
    }

    if (!category) {
      return Response.json(
        { error: "'category' is required in the request body" },
        { status: 400 }
      );
    }

    const id = Number(candidateId);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json(
        { error: "'candidateId' must be a positive integer" },
        { status: 400 }
      );
    }

    const categoryStr = String(category).toUpperCase();
    if (!Object.values(PolicyCategory).includes(categoryStr as PolicyCategory)) {
      return Response.json(
        {
          error: `Invalid category. Must be one of: ${Object.values(PolicyCategory).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Fetch candidate with vote history
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        state: { select: { name: true, abbreviation: true } },
        billVotes: {
          include: {
            bill: { select: { title: true, externalId: true } },
          },
          orderBy: { voteDate: "desc" },
          take: 20,
        },
      },
    });

    if (!candidate) {
      return Response.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Map vote history to the format expected by claude-client
    const votes = candidate.billVotes.map(
      (bv: {
        bill: { title: string; externalId: string };
        vote: string;
        voteDate: Date;
      }) => ({
        bill: `${bv.bill.title} (${bv.bill.externalId})`,
        vote: bv.vote as VoteChoice,
        date: bv.voteDate.toISOString().split("T")[0],
      })
    );

    // Call Claude for policy analysis
    const analysis = await analyzeCandidatePolicy({
      name: candidate.name,
      party: candidate.party,
      office: candidate.officeType,
      category: categoryStr as PolicyCategory,
      votes,
      statements: [], // TODO: wire up statements when that model is added
    });

    // Upsert the CandidatePolicy record
    const policy = await prisma.candidatePolicy.upsert({
      where: {
        candidateId_category: {
          candidateId: id,
          category: categoryStr as PolicyCategory,
        },
      },
      create: {
        candidateId: id,
        category: categoryStr as PolicyCategory,
        summary: analysis.summary,
        supportersPerspective: analysis.supporters_perspective,
        criticsPerspective: analysis.critics_perspective,
        aiAnalysis: JSON.stringify(analysis),
        sources: [],
        lastAnalyzedAt: new Date(),
      },
      update: {
        summary: analysis.summary,
        supportersPerspective: analysis.supporters_perspective,
        criticsPerspective: analysis.critics_perspective,
        aiAnalysis: JSON.stringify(analysis),
        lastAnalyzedAt: new Date(),
      },
    });

    return Response.json({
      policy,
      analysis,
    });
  } catch (error) {
    console.error("[ai/analyze-candidate] Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
