import { prisma } from "@/lib/db";
import { analyzeCourtCase } from "@/lib/ai/claude-client";

// ─────────────────────────────────────────────
// GET /api/cron/analyze-cases
//
// Finds SCOTUS cases that have been decided but don't yet have an
// AI summary, and generates a plain-English summary + impact analysis
// using Claude Haiku.
//
// Processes up to 5 cases per run to control API costs.
// ─────────────────────────────────────────────

const BATCH_SIZE = 5;
const DELAY_MS = 500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function GET() {
  try {
    const cases = await prisma.courtCase.findMany({
      where: {
        status: "DECIDED",
        aiSummary: null,
        conclusion: { not: null },
      },
      take: BATCH_SIZE,
      orderBy: { dateDecided: "desc" },
    });

    if (cases.length === 0) {
      return Response.json({
        success: true,
        analyzed: 0,
        message: "No cases need analysis.",
      });
    }

    let analyzed = 0;
    let errors = 0;

    for (const c of cases) {
      try {
        const question = c.question ? stripHtml(c.question) : "";
        const facts = c.factsOfTheCase ? stripHtml(c.factsOfTheCase) : "";
        const conclusion = c.conclusion ? stripHtml(c.conclusion) : "";

        if (!conclusion) continue;

        const result = await analyzeCourtCase(
          c.name,
          question,
          facts,
          conclusion
        );

        await prisma.courtCase.update({
          where: { id: c.id },
          data: {
            aiSummary: result.plain_english_summary,
            aiImpactAnalysis: result.impact_analysis,
          },
        });

        analyzed++;
        console.log(`[analyze-cases] Analyzed: ${c.name}`);
        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`[analyze-cases] Error analyzing ${c.name}:`, err);
        errors++;
      }
    }

    return Response.json({ success: true, analyzed, errors });
  } catch (error) {
    console.error("[analyze-cases] Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
