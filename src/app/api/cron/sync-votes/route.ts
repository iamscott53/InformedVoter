// ─────────────────────────────────────────────
// GET /api/cron/sync-votes
// Vercel Cron Job — sync roll-call vote records from Congress.gov API v3
// Schedule: daily (configure in vercel.json)
// ─────────────────────────────────────────────

import { prisma } from "@/lib/db";
import { VoteChoice } from "@prisma/client";

const CONGRESS_API_BASE = "https://api.congress.gov/v3";
const CURRENT_CONGRESS = 119;
const VOTES_PER_CHAMBER = 20;
const DELAY_MS = 500;

// ─────────────────────────────────────────────
// Congress.gov API response types
// ─────────────────────────────────────────────

interface CongressVoteListItem {
  url: string;
  congress: number;
  chamber: string;
  number: number;
  date: string;
  sessionNumber?: number;
}

interface CongressVoteListResponse {
  votes: CongressVoteListItem[];
}

interface CongressVoteMember {
  memberId: string;
  memberName: string;
}

interface CongressVoteDetail {
  vote: {
    congress?: number;
    chamber?: string;
    date?: string;
    bill?: {
      number: number;
      type: string;
      congress?: number;
      title?: string;
    };
    votes?: {
      memberVotes: Record<string, CongressVoteMember[]>;
    };
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildApiUrl(path: string, extraParams?: Record<string, string>): string {
  const url = new URL(`${CONGRESS_API_BASE}${path}`);
  url.searchParams.set("api_key", process.env.CONGRESS_GOV_API_KEY ?? "");
  url.searchParams.set("format", "json");
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

async function congressFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (res.status === 429) {
    throw new Error("Congress.gov rate limit exceeded (429). Try again later.");
  }
  if (!res.ok) {
    throw new Error(
      `Congress.gov API error: ${res.status} ${res.statusText} — ${url}`
    );
  }

  return res.json() as Promise<T>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Map a Congress.gov vote position string to a VoteChoice enum value.
 */
function mapVotePosition(position: string): VoteChoice {
  const normalized = position.trim().toLowerCase();
  if (normalized === "yea" || normalized === "aye") return VoteChoice.YES;
  if (normalized === "nay" || normalized === "no") return VoteChoice.NO;
  if (normalized === "not voting") return VoteChoice.NOT_VOTING;
  // "Present" maps to ABSTAIN (VoteChoice enum does not have a PRESENT value)
  if (normalized === "present") return VoteChoice.ABSTAIN;
  // Fallback for any unrecognized position
  return VoteChoice.NOT_VOTING;
}

/**
 * Build the externalId for a bill: "{congress}-{type}-{number}"
 * e.g. "119-hr-1234"
 */
function buildExternalId(congress: number, type: string, number: number): string {
  return `${congress}-${type.toLowerCase()}-${number}`;
}

// ─────────────────────────────────────────────
// Lookup maps
// ─────────────────────────────────────────────

type CandidateMap = Map<string, number>; // bioguideId → Candidate.id
type BillMap = Map<string, number>;      // externalId → Bill.id

/**
 * Build a lookup map of bioguideId → candidate.id for all candidates
 * that have a bioguideId in their contactInfo JSON field.
 */
async function buildCandidateMap(): Promise<CandidateMap> {
  const candidates = await prisma.candidate.findMany({
    where: {
      contactInfo: {
        path: ["bioguideId"],
        not: { equals: "" },
      },
    },
    select: {
      id: true,
      contactInfo: true,
    },
  });

  const map: CandidateMap = new Map();
  for (const c of candidates) {
    const info = c.contactInfo as Record<string, unknown> | null;
    const bioguideId = info?.bioguideId;
    if (typeof bioguideId === "string" && bioguideId) {
      map.set(bioguideId, c.id);
    }
  }
  return map;
}

/**
 * Build a lookup map of externalId → bill.id for all bills in the database.
 */
async function buildBillMap(): Promise<BillMap> {
  const bills = await prisma.bill.findMany({
    select: { id: true, externalId: true },
  });

  const map: BillMap = new Map();
  for (const b of bills) {
    map.set(b.externalId, b.id);
  }
  return map;
}

// ─────────────────────────────────────────────
// Vote list fetcher
// ─────────────────────────────────────────────

async function fetchRecentVotes(chamber: string): Promise<CongressVoteListItem[]> {
  const url = buildApiUrl(`/vote/${CURRENT_CONGRESS}/${chamber}`, {
    limit: String(VOTES_PER_CHAMBER),
  });

  console.log(`[sync-votes] Fetching ${chamber} votes: ${url}`);
  const data = await congressFetch<CongressVoteListResponse>(url);
  const votes = data.votes ?? [];
  console.log(`[sync-votes] Got ${votes.length} ${chamber} votes`);
  return votes;
}

// ─────────────────────────────────────────────
// Vote detail fetcher
// ─────────────────────────────────────────────

async function fetchVoteDetail(voteItem: CongressVoteListItem): Promise<CongressVoteDetail | null> {
  try {
    // The list item's `url` field contains the detail URL.
    // Append api_key and format params.
    const detailUrl = new URL(voteItem.url);
    detailUrl.searchParams.set("api_key", process.env.CONGRESS_GOV_API_KEY ?? "");
    detailUrl.searchParams.set("format", "json");

    return await congressFetch<CongressVoteDetail>(detailUrl.toString());
  } catch (err) {
    console.warn(
      `[sync-votes] Could not fetch vote detail for ${voteItem.chamber} vote #${voteItem.number}:`,
      err
    );
    return null;
  }
}

// ─────────────────────────────────────────────
// Process a single vote roll-call
// ─────────────────────────────────────────────

interface ProcessResult {
  upserted: number;
  skippedNoBill: boolean;
  skippedNoMembers: number;
  errors: number;
}

async function processVote(
  voteItem: CongressVoteListItem,
  detail: CongressVoteDetail,
  billMap: BillMap,
  candidateMap: CandidateMap
): Promise<ProcessResult> {
  const result: ProcessResult = {
    upserted: 0,
    skippedNoBill: false,
    skippedNoMembers: 0,
    errors: 0,
  };

  const bill = detail.vote?.bill;
  if (!bill || !bill.type || bill.number == null) {
    // Procedural vote with no bill attached — skip
    result.skippedNoBill = true;
    return result;
  }

  // Build the externalId to look up the bill
  const congress = bill.congress ?? voteItem.congress ?? CURRENT_CONGRESS;
  const externalId = buildExternalId(congress, bill.type, bill.number);
  const billId = billMap.get(externalId);

  if (!billId) {
    // Bill not in our database — skip
    result.skippedNoBill = true;
    return result;
  }

  // Parse the vote date
  const voteDate = detail.vote.date
    ? new Date(detail.vote.date)
    : new Date(voteItem.date);

  // Process member votes from all position categories
  const memberVotes = detail.vote.votes?.memberVotes;
  if (!memberVotes) {
    result.skippedNoBill = true;
    return result;
  }

  for (const [position, members] of Object.entries(memberVotes)) {
    if (!Array.isArray(members)) continue;

    const voteChoice = mapVotePosition(position);

    for (const member of members) {
      const bioguideId = member.memberId;
      if (!bioguideId) continue;

      const candidateId = candidateMap.get(bioguideId);
      if (!candidateId) {
        result.skippedNoMembers++;
        continue;
      }

      try {
        await prisma.billVote.upsert({
          where: {
            billId_candidateId: { billId, candidateId },
          },
          create: {
            billId,
            candidateId,
            vote: voteChoice,
            voteDate,
          },
          update: {
            vote: voteChoice,
            voteDate,
          },
        });
        result.upserted++;
      } catch (err) {
        result.errors++;
        console.error(
          `[sync-votes] Error upserting vote for bill ${externalId}, member ${bioguideId}:`,
          err
        );
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "CONGRESS_GOV_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  const startTime = Date.now();
  console.log(
    `[sync-votes] Starting Congress.gov vote sync (congress: ${CURRENT_CONGRESS})...`
  );

  try {
    // 1. Build lookup maps for bills and candidates
    const [billMap, candidateMap] = await Promise.all([
      buildBillMap(),
      buildCandidateMap(),
    ]);
    console.log(
      `[sync-votes] Loaded ${billMap.size} bills and ${candidateMap.size} candidates into lookup maps`
    );

    // 2. Fetch recent votes from both chambers
    const chambers: string[] = ["house", "senate"];
    const allVotes: CongressVoteListItem[] = [];

    for (const chamber of chambers) {
      const votes = await fetchRecentVotes(chamber);
      allVotes.push(...votes);
      await delay(DELAY_MS);
    }

    console.log(`[sync-votes] Fetched ${allVotes.length} total votes across both chambers`);

    if (allVotes.length === 0) {
      return Response.json({
        synced: 0,
        skippedNoBill: 0,
        skippedNoMember: 0,
        errors: 0,
        message: "No votes returned from Congress.gov API",
      });
    }

    // 3. Process each vote — fetch detail and upsert member votes
    let totalUpserted = 0;
    let totalSkippedNoBill = 0;
    let totalSkippedNoMember = 0;
    let totalErrors = 0;
    let votesProcessed = 0;

    for (let i = 0; i < allVotes.length; i++) {
      const voteItem = allVotes[i];
      const label = `${voteItem.chamber} vote #${voteItem.number}`;

      try {
        const detail = await fetchVoteDetail(voteItem);
        if (!detail) {
          totalErrors++;
          continue;
        }

        const result = await processVote(voteItem, detail, billMap, candidateMap);
        totalUpserted += result.upserted;
        totalSkippedNoMember += result.skippedNoMembers;
        totalErrors += result.errors;

        if (result.skippedNoBill) {
          totalSkippedNoBill++;
        } else {
          votesProcessed++;
        }
      } catch (err) {
        totalErrors++;
        console.error(`[sync-votes] Error processing ${label}:`, err);
      }

      // Rate-limit delay between API calls
      if (i < allVotes.length - 1) {
        await delay(DELAY_MS);
      }

      // Log progress every 10 votes
      if ((i + 1) % 10 === 0 || i + 1 === allVotes.length) {
        console.log(
          `[sync-votes] Progress: ${i + 1}/${allVotes.length} votes fetched ` +
            `(upserted: ${totalUpserted}, skippedNoBill: ${totalSkippedNoBill}, errors: ${totalErrors})`
        );
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(
      `[sync-votes] Sync complete in ${elapsed}s — ` +
        `upserted: ${totalUpserted}, votesProcessed: ${votesProcessed}, ` +
        `skippedNoBill: ${totalSkippedNoBill}, skippedNoMember: ${totalSkippedNoMember}, ` +
        `errors: ${totalErrors}`
    );

    return Response.json({
      synced: totalUpserted,
      votesProcessed,
      totalVotesFetched: allVotes.length,
      skippedNoBill: totalSkippedNoBill,
      skippedNoMember: totalSkippedNoMember,
      errors: totalErrors,
      congress: CURRENT_CONGRESS,
      elapsedSeconds: parseFloat(elapsed),
      message: `Successfully upserted ${totalUpserted} vote records from ${votesProcessed} roll-call votes`,
    });
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[sync-votes] Fatal error after ${elapsed}s:`, error);
    return Response.json(
      {
        error: "Sync failed",
        detail: error instanceof Error ? error.message : String(error),
        elapsedSeconds: parseFloat(elapsed),
      },
      { status: 500 }
    );
  }
}
