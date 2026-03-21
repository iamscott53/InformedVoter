// ─────────────────────────────────────────────
// GET /api/cron/sync-votes
// Vercel Cron Job — sync roll-call vote records from Congress.gov API
// Schedule: daily (configure in vercel.json)
// ─────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: Implement vote sync
    // 1. Fetch recent House and Senate votes from Congress.gov:
    //    GET https://api.congress.gov/v3/vote/{congress}/{chamber}?limit=250&api_key=KEY
    // 2. For each vote roll-call, fetch individual member votes:
    //    GET https://api.congress.gov/v3/vote/{congress}/{chamber}/{sessionNumber}/{rollCallNumber}
    // 3. Map vote position strings to VoteChoice enum:
    //    "Yea" / "Yes" → YES
    //    "Nay" / "No"  → NO
    //    "Present"     → ABSTAIN
    //    "Not Voting"  → NOT_VOTING
    // 4. Resolve bill and candidate IDs from externalId / bioguideId
    // 5. Upsert BillVote records (unique on billId + candidateId)
    //
    // Example upsert:
    // await prisma.billVote.upsert({
    //   where: { billId_candidateId: { billId, candidateId } },
    //   create: { billId, candidateId, vote, voteDate },
    //   update: { vote, voteDate },
    // });

    return Response.json({ synced: 0, message: "Vote sync not yet implemented" });
  } catch (error) {
    console.error("[cron/sync-votes] Error:", error);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
