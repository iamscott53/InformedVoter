/**
 * LegiScan API Client
 * Free tier: 30,000 queries/month
 * Docs: https://legiscan.com/legiscan
 *
 * Covers all 50 states + federal bills, full text, roll calls, sponsors.
 */

const BASE_URL = "https://api.legiscan.com";
const API_KEY = process.env.LEGISCAN_API_KEY || "";

interface LegiScanResponse<T = unknown> {
  status: "OK" | "ERROR";
  [key: string]: T | string;
}

async function legiscanFetch<T = unknown>(
  params: Record<string, string>
): Promise<T | null> {
  if (!API_KEY) {
    console.warn("[LegiScan] No API key set — skipping request");
    return null;
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });

  if (!res.ok) {
    console.error(`[LegiScan] HTTP ${res.status}: ${res.statusText}`);
    return null;
  }

  const json: LegiScanResponse<T> = await res.json();

  if (json.status !== "OK") {
    console.error("[LegiScan] API error:", json);
    return null;
  }

  return json as unknown as T;
}

// ─────────────────────────────────────────────
// State session list
// ─────────────────────────────────────────────

export interface LegiScanSession {
  session_id: number;
  state_id: number;
  year_start: number;
  year_end: number;
  session_name: string;
  session_title: string;
  special: number;
}

export async function getSessionList(
  state: string
): Promise<LegiScanSession[] | null> {
  const data = await legiscanFetch<{ sessions: LegiScanSession[] }>({
    op: "getSessionList",
    state,
  });
  return data?.sessions ?? null;
}

// ─────────────────────────────────────────────
// Master bill list for a state/session
// ─────────────────────────────────────────────

export interface LegiScanBillListItem {
  bill_id: number;
  number: string;
  change_hash: string;
  url: string;
  status_date: string;
  status: number;
  last_action_date: string;
  last_action: string;
  title: string;
}

export async function getMasterList(
  sessionId: number
): Promise<Record<string, LegiScanBillListItem> | null> {
  const data = await legiscanFetch<{
    masterlist: Record<string, LegiScanBillListItem>;
  }>({
    op: "getMasterList",
    id: sessionId.toString(),
  });
  return data?.masterlist ?? null;
}

export async function getMasterListByState(
  state: string
): Promise<Record<string, LegiScanBillListItem> | null> {
  const data = await legiscanFetch<{
    masterlist: Record<string, LegiScanBillListItem>;
  }>({
    op: "getMasterList",
    state,
  });
  return data?.masterlist ?? null;
}

// ─────────────────────────────────────────────
// Bill detail
// ─────────────────────────────────────────────

export interface LegiScanSponsor {
  people_id: number;
  person_hash: string;
  party_id: number;
  party: string;
  role_id: number;
  role: string;
  name: string;
  first_name: string;
  last_name: string;
  sponsor_type_id: number;
  sponsor_order: number;
}

export interface LegiScanVoteInfo {
  roll_call_id: number;
  date: string;
  desc: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  total: number;
  chamber: string;
  chamber_id: number;
}

export interface LegiScanBillDetail {
  bill_id: number;
  number: string;
  change_hash: string;
  session_id: number;
  session: { session_id: number; session_name: string };
  url: string;
  state_link: string;
  status: number;
  status_date: string;
  title: string;
  description: string;
  committee: { committee_id: number; chamber: string; name: string } | null;
  sponsors: LegiScanSponsor[];
  history: { date: string; action: string; chamber: string; chamber_id: number }[];
  votes: LegiScanVoteInfo[];
  texts: { doc_id: number; date: string; type: string; mime: string; url: string }[];
  subjects: { subject_id: number; subject_name: string }[];
}

export async function getBill(
  billId: number
): Promise<LegiScanBillDetail | null> {
  const data = await legiscanFetch<{ bill: LegiScanBillDetail }>({
    op: "getBill",
    id: billId.toString(),
  });
  return data?.bill ?? null;
}

// ─────────────────────────────────────────────
// Bill text
// ─────────────────────────────────────────────

export interface LegiScanBillText {
  doc_id: number;
  bill_id: number;
  date: string;
  type: string;
  mime: string;
  doc: string; // base64-encoded document
}

export async function getBillText(
  docId: number
): Promise<LegiScanBillText | null> {
  const data = await legiscanFetch<{ text: LegiScanBillText }>({
    op: "getBillText",
    id: docId.toString(),
  });
  return data?.text ?? null;
}

// ─────────────────────────────────────────────
// Roll call votes
// ─────────────────────────────────────────────

export interface LegiScanRollCallVote {
  people_id: number;
  vote_id: number;
  vote_text: string; // "Yea" | "Nay" | "NV" | "Absent"
}

export interface LegiScanRollCall {
  roll_call_id: number;
  bill_id: number;
  date: string;
  desc: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  total: number;
  chamber: string;
  votes: LegiScanRollCallVote[];
}

export async function getRollCall(
  rollCallId: number
): Promise<LegiScanRollCall | null> {
  const data = await legiscanFetch<{ roll_call: LegiScanRollCall }>({
    op: "getRollCall",
    id: rollCallId.toString(),
  });
  return data?.roll_call ?? null;
}

// ─────────────────────────────────────────────
// Person detail (legislator)
// ─────────────────────────────────────────────

export interface LegiScanPerson {
  people_id: number;
  person_hash: string;
  state_id: number;
  party_id: number;
  party: string;
  role_id: number;
  role: string;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  nickname: string;
  district: string;
  committee_sponsor: number;
  ballotpedia: string;
  followthemoney_eid: number;
  votesmart_id: number;
  opensecrets_id: string;
  knowwho_pid: number;
}

export async function getPerson(
  peopleId: number
): Promise<LegiScanPerson | null> {
  const data = await legiscanFetch<{ person: LegiScanPerson }>({
    op: "getPerson",
    id: peopleId.toString(),
  });
  return data?.person ?? null;
}

// ─────────────────────────────────────────────
// Search bills
// ─────────────────────────────────────────────

export interface LegiScanSearchResult {
  bill_id: number;
  bill_number: string;
  title: string;
  state: string;
  text_url: string;
  relevance: number;
}

export async function searchBills(
  state: string,
  query: string
): Promise<LegiScanSearchResult[] | null> {
  const data = await legiscanFetch<{
    searchresult: Record<string, LegiScanSearchResult | { summary: unknown }>;
  }>({
    op: "search",
    state,
    query,
  });

  if (!data?.searchresult) return null;

  return Object.values(data.searchresult).filter(
    (item): item is LegiScanSearchResult => "bill_id" in item
  );
}
