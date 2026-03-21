// ─────────────────────────────────────────────
// GET /api/cron/sync-bills
// Vercel Cron Job — sync recent bills from Congress.gov API
// Schedule: daily (configure in vercel.json)
// ─────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: Implement bill sync
    // 1. Fetch recent bills from Congress.gov API (sorted by updateDate desc):
    //    GET https://api.congress.gov/v3/bill?limit=250&sort=updateDate+desc&api_key=CONGRESS_GOV_API_KEY
    // 2. For each bill:
    //    a. Map Congress.gov chamber ("House" → HOUSE, "Senate" → SENATE)
    //    b. Map bill status from latest action text
    //    c. Resolve sponsor by bioguideId → Candidate.id
    //    d. Build congressGovUrl from bill type + number + congress
    // 3. Upsert into Bill table using externalId (e.g. "119-hr-1234")
    // 4. Sync subjects and cosponsors
    // 5. Paginate through all updated bills since last sync
    //
    // Example upsert:
    // await prisma.bill.upsert({
    //   where: { externalId },
    //   create: { externalId, title, chamber, status, introducedDate, sponsorId, congressGovUrl },
    //   update: { title, status, lastActionDate, updatedAt: new Date() },
    // });

    return Response.json({ synced: 0, message: "Bill sync not yet implemented" });
  } catch (error) {
    console.error("[cron/sync-bills] Error:", error);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
