// ─────────────────────────────────────────────
// GET /api/cron/sync-campaign-finance
// Vercel Cron Job — sync campaign finance data from the OpenFEC API
// Schedule: weekly (configure in vercel.json)
//
// Accepts ?manual=true to bypass the CRON_SECRET check in development.
// Accepts ?limit=N  to override how many candidates to process (default: 50).
// ─────────────────────────────────────────────

import { prisma } from "@/lib/db";
import { OfficeType, ContributionSizeRange } from "@prisma/client";

const FEC_API_BASE = "https://api.open.fec.gov/v1";

// Process at most this many candidates per run to stay within the
// OpenFEC rate limit of 1000 requests/hour (~3–4 calls per candidate).
const DEFAULT_CANDIDATES_PER_RUN = 50;

// Current election cycle: FEC uses even years.
// In an odd year we use the upcoming even year; in an even year we use the current one.
const now = new Date();
const CURRENT_CYCLE =
  now.getFullYear() % 2 === 0 ? now.getFullYear() : now.getFullYear() + 1;

// ─────────────────────────────────────────────
// OpenFEC API response types
// ─────────────────────────────────────────────

interface FecPagination {
  count: number;
  pages: number;
  per_page: number;
  page: number;
}

interface FecCandidateSearchResult {
  candidate_id: string;       // e.g. "H8TX22123"
  name: string;
  office: string;             // "H" | "S" | "P"
  state: string;              // two-letter abbreviation
  party: string;
  election_years?: number[];
  cycles?: number[];
}

interface FecCandidateSearchResponse {
  results: FecCandidateSearchResult[];
  pagination: FecPagination;
}

interface FecTotalsResult {
  candidate_id: string;
  cycle: number;
  receipts?: number;           // total raised
  disbursements?: number;      // total spent
  cash_on_hand_end_period?: number;
  last_cash_on_hand_end_period?: number;
  debts_owed_by_committee?: number;
  last_debts_owed_by_committee?: number;
  individual_itemized_contributions?: number;
  political_party_committee_contributions?: number;
  other_political_committee_contributions?: number;
  candidate_contribution?: number;  // self-funding
}

interface FecTotalsResponse {
  results: FecTotalsResult[];
  pagination: FecPagination;
}

interface FecContributionBySizeResult {
  candidate_id: string;
  cycle: number;
  size: number;  // 0=under200, 200, 500, 1000, 2000
  total: number;
  count: number;
}

interface FecContributionBySizeResponse {
  results: FecContributionBySizeResult[];
  pagination: FecPagination;
}

interface FecContributionByStateResult {
  candidate_id: string;
  cycle: number;
  state: string;
  state_full: string;
  total: number;
  count: number;
}

interface FecContributionByStateResponse {
  results: FecContributionByStateResult[];
  pagination: FecPagination;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildFecUrl(path: string, extraParams?: Record<string, string>): string {
  const url = new URL(`${FEC_API_BASE}${path}`);
  url.searchParams.set("api_key", process.env.FEC_API_KEY ?? "");
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

async function fecFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (res.status === 429) {
    throw new Error("OpenFEC rate limit exceeded (429). Try again later.");
  }
  if (!res.ok) {
    throw new Error(
      `OpenFEC API error: ${res.status} ${res.statusText} — ${url}`
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Map the FEC `size` bucket (0, 200, 500, 1000, 2000) to our enum.
 * FEC size codes: 0 = under $200, 200 = $200–499, 500 = $500–999,
 * 1000 = $1000–1999, 2000 = $2000+
 */
function fecSizeToEnum(size: number): ContributionSizeRange | null {
  switch (size) {
    case 0:    return ContributionSizeRange.UNDER_200;
    case 200:  return ContributionSizeRange.R200_TO_499;
    case 500:  return ContributionSizeRange.R500_TO_999;
    case 1000: return ContributionSizeRange.R1000_TO_2999;
    case 2000: return ContributionSizeRange.R3000_PLUS;
    default:   return null;
  }
}

// ─────────────────────────────────────────────
// Step 1 — Find the FEC candidate_id by name + state + office
// ─────────────────────────────────────────────

/**
 * Search the OpenFEC /candidates/search/ endpoint for a matching candidate.
 * Tries multiple name formats to maximize match rate.
 * Returns the FEC candidate_id string (e.g. "H8TX22123") or null if not found.
 */
async function findFecCandidateId(
  name: string,
  state: string,
  officeType: OfficeType
): Promise<string | null> {
  const officeCode = officeType === OfficeType.US_SENATOR ? "S" : "H";
  const stateUpper = state.toUpperCase();

  // Build multiple search queries from the Congress.gov name format "LastName, FirstName M."
  const nameVariants = buildNameVariants(name);

  for (const queryName of nameVariants) {
    const result = await searchFecCandidate(queryName, officeCode, stateUpper);
    if (result) return result;
  }

  return null;
}

/** Generate multiple name formats to try against FEC search */
function buildNameVariants(name: string): string[] {
  const variants: string[] = [];

  // Original name: "Reed, Jack" or "Cortez Masto, Catherine"
  variants.push(name);

  // If it's "LastName, FirstName Middle" format, extract parts
  if (name.includes(",")) {
    const [lastName, rest] = name.split(",", 2);
    const firstName = (rest ?? "").trim().split(/\s+/)[0]; // First word only, no middle initial

    if (lastName && firstName) {
      // "Jack Reed" (first last)
      variants.push(`${firstName} ${lastName.trim()}`);
      // Just last name — FEC will filter by state+office
      variants.push(lastName.trim());
    }
  }

  // Deduplicate
  return [...new Set(variants)];
}

/** Single FEC search attempt — tries with and without cycle filter */
async function searchFecCandidate(
  query: string,
  officeCode: string,
  state: string
): Promise<string | null> {
  // Try with current cycle first
  const baseParams = {
    q: query,
    office: officeCode,
    state,
    per_page: "5",
    page: "1",
  };

  try {
    const data = await fecFetch<FecCandidateSearchResponse>(
      buildFecUrl("/candidates/search/", {
        ...baseParams,
        election_year: String(CURRENT_CYCLE),
      })
    );

    const results = data.results ?? [];
    if (results.length > 0) {
      // Prefer incumbent or active candidate
      const incumbent = results.find((r) => r.candidate_id);
      return incumbent?.candidate_id ?? results[0].candidate_id;
    }

    // Retry without cycle filter
    const fallback = await fecFetch<FecCandidateSearchResponse>(
      buildFecUrl("/candidates/search/", baseParams)
    );
    const fallbackResults = fallback.results ?? [];
    if (fallbackResults.length > 0) {
      return fallbackResults[0].candidate_id;
    }
  } catch {
    // Non-fatal — try next variant
  }

  return null;
}

// ─────────────────────────────────────────────
// Step 2 — Fetch candidate totals
// ─────────────────────────────────────────────

async function fetchCandidateTotals(
  fecCandidateId: string,
  cycle: number
): Promise<FecTotalsResult | null> {
  // The /candidate/{id}/totals/ endpoint returns per-cycle fundraising summaries.
  const url = buildFecUrl(`/candidate/${fecCandidateId}/totals/`, {
    cycle: String(cycle),
    per_page: "5",
    page: "1",
  });

  try {
    const data = await fecFetch<FecTotalsResponse>(url);
    const results = data.results ?? [];
    // Return the record matching our target cycle (there may be multiple cycles returned)
    return results.find((r) => r.cycle === cycle) ?? results[0] ?? null;
  } catch (err) {
    console.warn(
      `[sync-campaign-finance] Totals fetch failed for ${fecCandidateId}:`, err
    );
    return null;
  }
}

// ─────────────────────────────────────────────
// Step 3 — Fetch contributions by size
// ─────────────────────────────────────────────

async function fetchContributionsBySize(
  fecCandidateId: string,
  cycle: number
): Promise<FecContributionBySizeResult[]> {
  const url = buildFecUrl("/schedules/schedule_a/by_size/by_candidate/", {
    candidate_id: fecCandidateId,
    cycle: String(cycle),
    per_page: "20",
    page: "1",
  });

  try {
    const data = await fecFetch<FecContributionBySizeResponse>(url);
    return data.results ?? [];
  } catch (err) {
    console.warn(
      `[sync-campaign-finance] Contributions-by-size fetch failed for ${fecCandidateId}:`, err
    );
    return [];
  }
}

// ─────────────────────────────────────────────
// Step 4 — Fetch contributions by state
// ─────────────────────────────────────────────

async function fetchContributionsByState(
  fecCandidateId: string,
  cycle: number
): Promise<FecContributionByStateResult[]> {
  const url = buildFecUrl("/schedules/schedule_a/by_state/by_candidate/", {
    candidate_id: fecCandidateId,
    cycle: String(cycle),
    per_page: "60",  // 50 states + DC + territories
    page: "1",
  });

  try {
    const data = await fecFetch<FecContributionByStateResponse>(url);
    return data.results ?? [];
  } catch (err) {
    console.warn(
      `[sync-campaign-finance] Contributions-by-state fetch failed for ${fecCandidateId}:`, err
    );
    return [];
  }
}

// ─────────────────────────────────────────────
// Upsert all finance data for a single candidate
// ─────────────────────────────────────────────

interface DbCandidate {
  id: number;
  name: string;
  officeType: OfficeType;
  contactInfo: unknown;
  state: { abbreviation: string } | null;
}

async function syncCandidateFinance(
  candidate: DbCandidate,
  cycle: number
): Promise<"synced" | "no_fec_id" | "no_data"> {
  const contactInfo = candidate.contactInfo as Record<string, unknown> | null;
  const stateAbbr = candidate.state?.abbreviation ?? "";

  // ── 1. Resolve the FEC candidate ID ────────────────────────────────────────
  // Check if we already have it stored from a previous run.
  const existingFinance = await prisma.candidateFinance.findFirst({
    where: { candidateId: candidate.id, cycle },
    select: { fecCandidateId: true },
  });

  let fecCandidateId = existingFinance?.fecCandidateId ?? null;

  if (!fecCandidateId) {
    fecCandidateId = await findFecCandidateId(
      candidate.name,
      stateAbbr,
      candidate.officeType
    );
  }

  if (!fecCandidateId) {
    console.warn(
      `[sync-campaign-finance] Could not find FEC ID for "${candidate.name}" (${stateAbbr})`
    );
    return "no_fec_id";
  }

  // ── 2. Fetch candidate totals (fall back to previous cycle if current has no data)
  let totals = await fetchCandidateTotals(fecCandidateId, cycle);
  let effectiveCycle = cycle;

  if (!totals && cycle > 2024) {
    // Try the previous election cycle
    effectiveCycle = cycle - 2;
    totals = await fetchCandidateTotals(fecCandidateId, effectiveCycle);
  }

  if (!totals) {
    console.warn(
      `[sync-campaign-finance] No totals data for ${fecCandidateId} (${candidate.name}) cycles ${cycle}/${effectiveCycle}`
    );
    return "no_data";
  }

  // ── 3. Upsert CandidateFinance ──────────────────────────────────────────────
  const financeData = {
    fecCandidateId,
    cycle: effectiveCycle,
    totalRaised:               totals.receipts                              ?? undefined,
    totalSpent:                totals.disbursements                         ?? undefined,
    cashOnHand:                totals.last_cash_on_hand_end_period ?? totals.cash_on_hand_end_period ?? undefined,
    totalDebt:                 totals.last_debts_owed_by_committee ?? totals.debts_owed_by_committee ?? undefined,
    individualContributions:   totals.individual_itemized_contributions     ?? undefined,
    pacContributions:          totals.other_political_committee_contributions ?? undefined,
    partyContributions:        totals.political_party_committee_contributions ?? undefined,
    selfFunding:               totals.candidate_contribution                ?? undefined,
    lastUpdated:               new Date(),
  };

  const financeRecord = await prisma.candidateFinance.upsert({
    where: { candidateId_cycle: { candidateId: candidate.id, cycle: effectiveCycle } },
    create: { candidateId: candidate.id, ...financeData },
    update: financeData,
    select: { id: true },
  });

  const financeId = financeRecord.id;

  // ── 4. Fetch and upsert contributions by size ───────────────────────────────
  const sizeResults = await fetchContributionsBySize(fecCandidateId, effectiveCycle);

  for (const row of sizeResults) {
    const sizeRange = fecSizeToEnum(row.size);
    if (!sizeRange) continue;

    await prisma.candidateContributionBySize.upsert({
      where: {
        candidateFinanceId_sizeRange_cycle: {
          candidateFinanceId: financeId,
          sizeRange,
          cycle: effectiveCycle,
        },
      },
      create: {
        candidateFinanceId: financeId,
        sizeRange,
        total: row.total,
        count: row.count ?? 0,
        cycle: effectiveCycle,
      },
      update: {
        total: row.total,
        count: row.count ?? 0,
      },
    });
  }

  // ── 5. Fetch and upsert contributions by state ──────────────────────────────
  const stateResults = await fetchContributionsByState(fecCandidateId, effectiveCycle);

  for (const row of stateResults) {
    if (!row.state) continue;

    await prisma.candidateContributionByState.upsert({
      where: {
        candidateFinanceId_contributorState_cycle: {
          candidateFinanceId: financeId,
          contributorState: row.state,
          cycle: effectiveCycle,
        },
      },
      create: {
        candidateFinanceId: financeId,
        contributorState: row.state,
        totalAmount: row.total,
        contributionCount: row.count ?? 1,
        cycle: effectiveCycle,
      },
      update: {
        totalAmount: row.total,
        contributionCount: row.count ?? 1,
      },
    });
  }

  console.log(
    `[sync-campaign-finance] Synced ${candidate.name} (${fecCandidateId}) — ` +
      `raised: $${totals.receipts?.toLocaleString() ?? "n/a"}, ` +
      `size buckets: ${sizeResults.length}, states: ${stateResults.length}`
  );

  return "synced";
}

// ─────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isManual = searchParams.get("manual") === "true";

  // Auth check — bypass with ?manual=true in development only
  if (isManual) {
    if (process.env.NODE_ENV !== "development") {
      return Response.json(
        { error: "Manual trigger is only allowed in development" },
        { status: 403 }
      );
    }
    console.log("[sync-campaign-finance] Manual trigger in development mode — skipping auth");
  } else {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiKey = process.env.FEC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "FEC_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  // Allow caller to override how many candidates to process
  const limitParam = searchParams.get("limit");
  const candidatesPerRun = limitParam
    ? Math.min(Math.max(1, parseInt(limitParam, 10)), 200)
    : DEFAULT_CANDIDATES_PER_RUN;

  const startTime = Date.now();
  console.log(
    `[sync-campaign-finance] Starting OpenFEC campaign finance sync ` +
      `(cycle: ${CURRENT_CYCLE}, max candidates: ${candidatesPerRun})...`
  );

  try {
    // ── 1. Load federal candidates that have a bioguideId in contactInfo ───────
    // We rely on the bioguideId being present to confirm these are real members
    // synced from Congress.gov; we use name + state to look up FEC IDs.
    const candidates = await prisma.candidate.findMany({
      where: {
        officeType: { in: [OfficeType.US_SENATOR, OfficeType.US_REPRESENTATIVE] },
        // Only process candidates that have a bioguideId in contactInfo
        // (synced from Congress.gov). Filter candidates without it in JS below.
        NOT: {
          contactInfo: { equals: {} },
        },
      },
      select: {
        id: true,
        name: true,
        officeType: true,
        contactInfo: true,
        state: {
          select: { abbreviation: true },
        },
      },
      orderBy: { id: "asc" },
      take: candidatesPerRun,
    });

    // Filter to only those with a bioguideId in contactInfo JSON
    const filteredCandidates = candidates.filter((c) => {
      const info = c.contactInfo as Record<string, unknown> | null;
      return info && typeof info === "object" && "bioguideId" in info && info.bioguideId;
    });

    console.log(
      `[sync-campaign-finance] Found ${filteredCandidates.length} federal candidates with bioguideId to process`
    );

    if (filteredCandidates.length === 0) {
      return Response.json({
        synced: 0,
        noFecId: 0,
        noData: 0,
        errors: 0,
        cycle: CURRENT_CYCLE,
        message: "No federal candidates with bioguideId found in database",
      });
    }

    // ── 2. Sync finance data for each candidate ─────────────────────────────
    let synced = 0;
    let noFecId = 0;
    let noData = 0;
    let errors = 0;

    for (let i = 0; i < filteredCandidates.length; i++) {
      const candidate = filteredCandidates[i];

      try {
        const result = await syncCandidateFinance(candidate, CURRENT_CYCLE);
        if (result === "synced")     synced++;
        else if (result === "no_fec_id") noFecId++;
        else if (result === "no_data")   noData++;
      } catch (err) {
        errors++;
        console.error(
          `[sync-campaign-finance] Error processing candidate "${candidate.name}" (id=${candidate.id}):`,
          err
        );
      }

      // Log progress every 10 candidates
      if ((i + 1) % 10 === 0 || i + 1 === filteredCandidates.length) {
        console.log(
          `[sync-campaign-finance] Progress: ${i + 1}/${filteredCandidates.length} ` +
            `(synced: ${synced}, no_fec_id: ${noFecId}, no_data: ${noData}, errors: ${errors})`
        );
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(
      `[sync-campaign-finance] Sync complete in ${elapsed}s — ` +
        `synced: ${synced}, no_fec_id: ${noFecId}, no_data: ${noData}, errors: ${errors}`
    );

    return Response.json({
      synced,
      noFecId,
      noData,
      errors,
      total: filteredCandidates.length,
      cycle: CURRENT_CYCLE,
      elapsedSeconds: parseFloat(elapsed),
      message: `Successfully synced finance data for ${synced} of ${filteredCandidates.length} candidates`,
    });
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[sync-campaign-finance] Fatal error after ${elapsed}s:`, error);
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
