// ─────────────────────────────────────────────
// GET /api/cron/analyze-bills
// Vercel Cron Job — run AI analysis on bills that haven't been analyzed yet
// Schedule: daily (configure in vercel.json)
// ─────────────────────────────────────────────

import { prisma } from "@/lib/db";
import { analyzeBill, detectRiders } from "@/lib/ai/claude-client";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { analyzed: 0, errors: 0, total: 0 };

  try {
    // 1. Query bills that haven't been analyzed yet
    const bills = await prisma.bill.findMany({
      where: { executiveSummary: null },
      take: 10,
      orderBy: { introducedDate: "desc" },
    });

    results.total = bills.length;

    // 2. Process each bill individually so one failure doesn't stop the batch
    for (const bill of bills) {
      try {
        // Build the text description from available fields
        const billText = [
          `Title: ${bill.title}`,
          bill.shortTitle ? `Short title: ${bill.shortTitle}` : null,
          bill.subjects &&
          Array.isArray(bill.subjects) &&
          (bill.subjects as string[]).length > 0
            ? `\nSubjects: ${(bill.subjects as string[]).join(", ")}`
            : null,
          bill.executiveSummary
            ? `\nExisting summary: ${bill.executiveSummary}`
            : null,
          bill.detailedSummary
            ? `\nDetailed summary: ${bill.detailedSummary}`
            : null,
          bill.fullTextUrl
            ? `\nFull text available at: ${bill.fullTextUrl}`
            : null,
        ]
          .filter(Boolean)
          .join("\n");

        // Run analysis and rider detection in parallel
        const [analysis, riderResult] = await Promise.all([
          analyzeBill(bill.title, billText),
          detectRiders(bill.title, billText, billText),
        ]);

        // Persist results
        await prisma.bill.update({
          where: { id: bill.id },
          data: {
            executiveSummary: analysis.executive_summary,
            detailedSummary: analysis.detailed_summary,
            aiRiderAnalysis: riderResult.summary,
            hiddenClauses: riderResult.riders,
          },
        });

        results.analyzed++;
        console.log(
          `[cron/analyze-bills] Analyzed bill ${bill.id}: ${bill.title}`
        );
      } catch (error) {
        results.errors++;
        console.error(
          `[cron/analyze-bills] Failed to analyze bill ${bill.id}:`,
          error
        );
      }

      // Delay between bills to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return Response.json(results);
  } catch (error) {
    console.error("[cron/analyze-bills] Error:", error);
    return Response.json({ error: "Analysis batch failed" }, { status: 500 });
  }
}
