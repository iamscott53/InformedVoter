// ─────────────────────────────────────────────
// Congress.gov API client
// Docs: https://api.congress.gov/
// ─────────────────────────────────────────────

const BASE_URL = "https://api.congress.gov/v3";
const API_KEY = process.env.CONGRESS_GOV_API_KEY ?? "";

// ─────────────────────────────────────────────
// Response shape stubs
// (Expand these as real parsing is added)
// ─────────────────────────────────────────────

export interface CongressMember {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  district?: string | null;
  chamber: string;
  terms?: unknown;
}

export interface CongressBill {
  congress: number;
  type: string;
  number: string;
  title: string;
  introducedDate: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
  sponsors?: Array<{ bioguideId: string; fullName: string }>;
}

export interface CongressBillDetails extends CongressBill {
  summary?: string;
  fullText?: string;
  subjects?: string[];
  policyArea?: { name: string };
  cosponsors?: Array<{ bioguideId: string; fullName: string }>;
}

export interface CongressMemberDetails extends CongressMember {
  birthYear?: string;
  leadership?: unknown;
  officialWebsiteUrl?: string;
  depiction?: { imageUrl: string };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

interface FetchOptions {
  params?: Record<string, string | number | boolean>;
}

async function congressFetch<T>(
  path: string,
  { params = {} }: FetchOptions = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("format", "json");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `Congress.gov API error: ${res.status} ${res.statusText} — ${path}`
    );
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Public API functions
// ─────────────────────────────────────────────

/**
 * Retrieve all members for a given chamber and Congress number.
 * Default congress is 119 (current as of 2025-2027).
 */
export async function getMembers(
  chamber: "house" | "senate",
  congress = 119
): Promise<CongressMember[]> {
  // TODO: parse response — shape is { members: [...] }
  const data = await congressFetch<{ members: CongressMember[] }>(
    `/member/congress/${congress}/${chamber}`,
    { params: { limit: 250 } }
  );
  return data.members ?? [];
}

/**
 * Retrieve a paginated list of bills for a given Congress.
 */
export async function getBills(
  congress = 119,
  options: {
    limit?: number;
    offset?: number;
    sort?: string;
    fromDateTime?: string;
    toDateTime?: string;
  } = {}
): Promise<CongressBill[]> {
  // TODO: parse response — shape is { bills: [...] }
  const { limit = 20, offset = 0, ...rest } = options;
  const data = await congressFetch<{ bills: CongressBill[] }>(
    `/bill/${congress}`,
    { params: { limit, offset, ...rest } }
  );
  return data.bills ?? [];
}

/**
 * Retrieve full details for a specific bill.
 * @param billType  e.g. "hr", "s", "hjres", "sjres"
 * @param billNumber  e.g. 1234
 */
export async function getBillDetails(
  congress = 119,
  billType: string,
  billNumber: number | string
): Promise<CongressBillDetails | null> {
  // TODO: parse response — shape is { bill: { ... } }
  const data = await congressFetch<{ bill: CongressBillDetails }>(
    `/bill/${congress}/${billType.toLowerCase()}/${billNumber}`
  );
  return data.bill ?? null;
}

/**
 * Retrieve detailed information for a single member by their bioguide ID.
 * @param bioguideId  e.g. "P000197"
 */
export async function getMemberDetails(
  bioguideId: string
): Promise<CongressMemberDetails | null> {
  // TODO: parse response — shape is { member: { ... } }
  const data = await congressFetch<{ member: CongressMemberDetails }>(
    `/member/${bioguideId}`
  );
  return data.member ?? null;
}
