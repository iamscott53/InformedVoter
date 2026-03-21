// ─────────────────────────────────────────────
// GET /api/cron/analyze-candidates
// Vercel Cron Job — run AI policy analysis on candidates across all categories
// Schedule: weekly (configure in vercel.json)
// ─────────────────────────────────────────────

import { prisma } from "@/lib/db";
import { analyzeCandidatePolicy } from "@/lib/ai/claude-client";
import { PolicyCategory } from "@/types";

const BATCH_SIZE = 5;
const STALE_DAYS = 30;
const DELAY_MS = 1000;

/** Pause execution for the given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - STALE_DAYS);

    // Fetch candidates that have missing or stale policy analyses
    const candidates = await prisma.candidate.findMany({
      where: {
        OR: [
          { policies: { none: {} } },
          { policies: { some: { lastAnalyzedAt: { lt: thirtyDaysAgo } } } },
        ],
      },
      take: BATCH_SIZE,
      include: {
        state: { select: { name: true, abbreviation: true } },
        billVotes: {
          include: {
            bill: { select: { title: true, externalId: true } },
          },
          orderBy: { voteDate: "desc" },
          take: 20,
        },
        policies: {
          select: { category: true, lastAnalyzedAt: true },
        },
      },
    });

    if (candidates.length === 0) {
      return Response.json({
        candidatesProcessed: 0,
        policiesAnalyzed: 0,
        message: "No candidates need analysis at this time",
      });
    }

    let policiesAnalyzed = 0;
    const errors: string[] = [];

    const allCategories = Object.values(PolicyCategory);

    for (const candidate of candidates) {
      // Build a set of categories that were recently analyzed (within 30 days)
      const recentlyAnalyzed = new Set(
        candidate.policies
          .filter(
            (p: { category: string; lastAnalyzedAt: Date | null }) =>
              p.lastAnalyzedAt && p.lastAnalyzedAt >= thirtyDaysAgo
          )
          .map((p: { category: string }) => p.category)
      );

      // Map vote history to the format expected by claude-client
      const votes = candidate.billVotes.map(
        (bv: {
          bill: { title: string; externalId: string };
          vote: string;
          voteDate: Date;
        }) => ({
          bill: `${bv.bill.title} (${bv.bill.externalId})`,
          vote: bv.vote as import("@/types").VoteChoice,
          date: bv.voteDate.toISOString().split("T")[0],
        })
      );

      for (const category of allCategories) {
        // Skip categories already analyzed within the past 30 days
        if (recentlyAnalyzed.has(category)) {
          continue;
        }

        try {
          const analysis = await analyzeCandidatePolicy({
            name: candidate.name,
            party: candidate.party,
            office: candidate.officeType,
            category,
            votes,
            statements: [],
          });

          // Upsert the CandidatePolicy record
          await prisma.candidatePolicy.upsert({
            where: {
              candidateId_category: {
                candidateId: candidate.id,
                category,
              },
            },
            create: {
              candidateId: candidate.id,
              category,
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

          policiesAnalyzed++;
          console.log(
            `[cron/analyze-candidates] Analyzed ${candidate.name} — ${category}`
          );

          // Delay between API calls to avoid rate limiting
          await sleep(DELAY_MS);
        } catch (err) {
          const msg = `Failed to analyze ${candidate.name} — ${category}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(`[cron/analyze-candidates] ${msg}`);
          errors.push(msg);
        }
      }
    }

    return Response.json({
      candidatesProcessed: candidates.length,
      policiesAnalyzed,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processed ${candidates.length} candidate(s), analyzed ${policiesAnalyzed} policy category(ies)`,
    });
  } catch (error) {
    console.error("[cron/analyze-candidates] Error:", error);
    return Response.json({ error: "Analysis batch failed" }, { status: 500 });
  }
}
