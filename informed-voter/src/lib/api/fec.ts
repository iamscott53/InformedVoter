// ─────────────────────────────────────────────
// OpenFEC API client
// Docs: https://api.open.fec.gov/developers/
// ─────────────────────────────────────────────

const BASE_URL = "https://api.open.fec.gov/v1";
const API_KEY = process.env.FEC_API_KEY ?? "DEMO_KEY";

// ─────────────────────────────────────────────
// Response shape stubs
// ─────────────────────────────────────────────

export interface FecCandidateTotals {
  candidate_id: string;
  cycle: number;
  receipts: number;
  disbursements: number;
  cash_on_hand_end_period: number;
  debts_owed_by_committee: number;
  individual_itemized_contributions: number;
  individual_unitemized_contributions: number;
  other_political_committee_contributions: number;
  candidate_contribution: number;
}

export interface FecScheduleAEmployer {
  contributor_employer: string;
  total: number;
  count: number;
}

export interface FecScheduleASize {
  size: number; // 0=<200, 200=200-499, 500=500-999, 1000=1000-1999, 2000=2000+
  total: number;
  count: number;
}

export interface FecScheduleAState {
  state: string;
  state_full: string;
  total: number;
  count: number;
}

export interface FecIndependentExpenditure {
  committee_name: string;
  total: number;
  count: number;
  support_oppose_indicator: "S" | "O";
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

interface FecApiResponse<T> {
  results: T[];
  pagination?: {
    count: number;
    page: number;
    pages: number;
    per_page: number;
  };
}

async function fecFetch<T>(
  path: string,
  params: Record<string, string | number | boolean> = {}
): Promise<FecApiResponse<T>> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("per_page", String(params.per_page ?? 20));

  for (const [key, value] of Object.entries(params)) {
    if (key !== "per_page") {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `OpenFEC API error: ${res.status} ${res.statusText} — ${path}`
    );
  }

  return res.json() as Promise<FecApiResponse<T>>;
}

// ─────────────────────────────────────────────
// Public API functions
// ─────────────────────────────────────────────

/**
 * Get total fundraising and spending figures for a candidate.
 * @param fecCandidateId  e.g. "P00000001"
 * @param cycle  e.g. 2024
 */
export async function getCandidateTotals(
  fecCandidateId: string,
  cycle: number
): Promise<FecCandidateTotals[]> {
  // TODO: parse and normalise response fields
  const data = await fecFetch<FecCandidateTotals>(
    `/candidate/${fecCandidateId}/totals/`,
    { cycle, per_page: 10 }
  );
  return data.results ?? [];
}

/**
 * Get itemised contributions aggregated by contributor employer for a committee.
 * @param committeeId  e.g. "C00000001"
 */
export async function getScheduleAByEmployer(
  committeeId: string
): Promise<FecScheduleAEmployer[]> {
  // TODO: parse and normalise response fields
  const data = await fecFetch<FecScheduleAEmployer>(
    "/schedules/schedule_a/by_employer/",
    { committee_id: committeeId, per_page: 50, sort: "-total" }
  );
  return data.results ?? [];
}

/**
 * Get contributions broken down by size bucket for a candidate.
 * @param candidateId  e.g. "P00000001"
 */
export async function getScheduleABySize(
  candidateId: string
): Promise<FecScheduleASize[]> {
  // TODO: parse and normalise response fields
  const data = await fecFetch<FecScheduleASize>(
    "/schedules/schedule_a/by_size/by_candidate/",
    { candidate_id: candidateId, per_page: 10 }
  );
  return data.results ?? [];
}

/**
 * Get contributions broken down by contributor state for a candidate.
 * @param candidateId  e.g. "P00000001"
 */
export async function getScheduleAByState(
  candidateId: string
): Promise<FecScheduleAState[]> {
  // TODO: parse and normalise response fields
  const data = await fecFetch<FecScheduleAState>(
    "/schedules/schedule_a/by_state/by_candidate/",
    { candidate_id: candidateId, per_page: 60, sort: "-total" }
  );
  return data.results ?? [];
}

/**
 * Get independent expenditures (PAC/outside spending) for or against a candidate.
 * @param candidateId  e.g. "P00000001"
 */
export async function getIndependentExpenditures(
  candidateId: string
): Promise<FecIndependentExpenditure[]> {
  // TODO: parse and normalise response fields
  const data = await fecFetch<FecIndependentExpenditure>(
    "/schedules/schedule_e/by_candidate/",
    { candidate_id: candidateId, per_page: 50, sort: "-total" }
  );
  return data.results ?? [];
}
