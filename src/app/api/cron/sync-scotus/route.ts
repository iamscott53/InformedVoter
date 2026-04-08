import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────
// GET /api/cron/sync-scotus
//
// Syncs SCOTUS data from two sources:
//   1. Oyez API — cases, justices, per-justice votes + ideology scores
//   2. CourtListener API — financial disclosures (gifts, reimbursements)
//
// Both APIs are free. CourtListener works without auth but benefits from
// a token (COURTLISTENER_API_TOKEN in .env) for higher rate limits.
// ─────────────────────────────────────────────

const CURRENT_TERM = new Date().getFullYear();
const TERMS_TO_SYNC = [CURRENT_TERM, CURRENT_TERM - 1, CURRENT_TERM - 2];
const DELAY_MS = 400; // polite delay between requests
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────
// Oyez types
// ─────────────────────────────────────────────

interface OyezCaseListItem {
  ID: number;
  href: string;
  name: string;
  docket_number: string;
  term: string;
  description: string;
  question: string;
  justia_url: string;
  timeline: Array<{ event: string; dates: Array<{ date: number }> }>;
}

interface OyezVote {
  member: { identifier: string; name: string };
  vote: string; // "majority" | "minority"
  opinion_type?: string;
  ideology?: number;
  joining?: Array<{ identifier: string }>;
}

interface OyezDecision {
  votes: OyezVote[];
  majority_vote: number;
  minority_vote: number;
  decision_type: string;
}

interface OyezCaseDetail {
  ID: number;
  name: string;
  docket_number: string;
  term: string;
  first_party: string;
  second_party: string;
  facts_of_the_case: string;
  question: string;
  conclusion: string;
  justia_url: string;
  decisions: OyezDecision[];
  timeline: Array<{ event: string; dates: Array<{ date: number }> }>;
}

interface OyezJustice {
  identifier: string;
  name: string;
  last_name: string;
  roles: Array<{
    role_title: string;
    appointing_president: string;
    institution_name: string;
    date_start: number;
    date_end: number;
  }>;
  date_of_birth: number;
  place_of_birth: string;
  gender: string;
  thumbnail: { href: string } | null;
  length_of_service: number;
}

interface OyezJusticeDetail extends OyezJustice {
  biography: string;
  law_school: string;
  home_state: string;
}

// ─────────────────────────────────────────────
// CourtListener types
// ─────────────────────────────────────────────

interface CLGift {
  source: string;
  description: string;
  value: string;
  redacted: boolean;
  financial_disclosure: string; // URL
}

interface CLReimbursement {
  source: string;
  location: string;
  purpose: string;
  items_paid_or_provided: string;
  redacted: boolean;
  financial_disclosure: string;
}

interface CLDisclosure {
  id: number;
  person: string; // URL
  year: number;
  filepath: string;
  is_amended: boolean;
}

interface CLPaginatedResponse<T> {
  count: number;
  next: string | null;
  results: T[];
}

// ─────────────────────────────────────────────
// Fetch helpers
// ─────────────────────────────────────────────

async function fetchOyez<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.oyez.org${path}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function courtListenerHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = process.env.COURTLISTENER_API_TOKEN?.trim();
  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }
  return headers;
}

async function fetchCL<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(
      `https://www.courtlistener.com/api/rest/v4${path}`,
      { headers: courtListenerHeaders(), cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Sync logic
// ─────────────────────────────────────────────

async function syncJustices(): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  const justices = await fetchOyez<OyezJustice[]>("/justices");
  if (!justices) return { synced: 0, errors: 1 };

  for (const j of justices) {
    try {
      // Fetch full detail for biography
      await sleep(DELAY_MS);
      const detail = await fetchOyez<OyezJusticeDetail>(
        `/people/${j.identifier}`
      );

      const scotusRole = j.roles?.find(
        (r) => r.institution_name === "Supreme Court of the United States"
      );

      await prisma.justice.upsert({
        where: { oyezIdentifier: j.identifier },
        create: {
          oyezIdentifier: j.identifier,
          name: j.name,
          firstName: j.name.split(" ")[0],
          lastName: j.last_name,
          dateOfBirth: j.date_of_birth
            ? new Date(j.date_of_birth * 1000)
            : null,
          placeOfBirth: j.place_of_birth ?? null,
          gender: j.gender ?? null,
          photoUrl: j.thumbnail?.href ?? null,
          biography: detail?.biography ?? null,
          lawSchool: detail?.law_school ?? null,
          appointingPresident: scotusRole?.appointing_president ?? null,
          roleTitle: scotusRole?.role_title ?? null,
          dateStart: scotusRole?.date_start
            ? new Date(scotusRole.date_start * 1000)
            : null,
          dateEnd:
            scotusRole?.date_end && scotusRole.date_end > 0
              ? new Date(scotusRole.date_end * 1000)
              : null,
          isActive:
            !scotusRole?.date_end || scotusRole.date_end <= 0,
        },
        update: {
          name: j.name,
          photoUrl: j.thumbnail?.href ?? null,
          biography: detail?.biography ?? null,
          lawSchool: detail?.law_school ?? null,
          appointingPresident: scotusRole?.appointing_president ?? null,
          roleTitle: scotusRole?.role_title ?? null,
          isActive:
            !scotusRole?.date_end || scotusRole.date_end <= 0,
        },
      });
      synced++;
    } catch (err) {
      console.error(`[sync-scotus] Error syncing justice ${j.identifier}:`, err);
      errors++;
    }
  }

  return { synced, errors };
}

async function syncCasesForTerm(
  term: number
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  const cases = await fetchOyez<OyezCaseListItem[]>(
    `/cases?filter=term:${term}&per_page=100`
  );
  if (!cases || !Array.isArray(cases)) return { synced: 0, errors: 0 };

  for (const c of cases) {
    try {
      await sleep(DELAY_MS);
      const detail = await fetchOyez<OyezCaseDetail>(
        `/cases/${term}/${c.docket_number}`
      );
      if (!detail) {
        errors++;
        continue;
      }

      // Parse dates from timeline
      const arguedEvent = detail.timeline?.find((t) => t.event === "Argued");
      const decidedEvent = detail.timeline?.find((t) => t.event === "Decided");
      const arguedDate = arguedEvent?.dates?.[0]?.date
        ? new Date(arguedEvent.dates[0].date * 1000)
        : null;
      const decidedDate = decidedEvent?.dates?.[0]?.date
        ? new Date(decidedEvent.dates[0].date * 1000)
        : null;

      const decision = detail.decisions?.[0];
      let status: "GRANTED" | "ARGUED" | "DECIDED" = "GRANTED";
      if (decidedDate) status = "DECIDED";
      else if (arguedDate) status = "ARGUED";

      const oyezId = `${term}/${detail.docket_number}`;

      const courtCase = await prisma.courtCase.upsert({
        where: { oyezId },
        create: {
          oyezId,
          name: detail.name,
          docketNumber: detail.docket_number,
          term,
          dateArgued: arguedDate,
          dateDecided: decidedDate,
          question: detail.question ?? null,
          factsOfTheCase: detail.facts_of_the_case ?? null,
          conclusion: detail.conclusion ?? null,
          decisionDirection: null,
          majorityVotes: decision?.majority_vote ?? null,
          minorityVotes: decision?.minority_vote ?? null,
          justiaUrl: detail.justia_url ?? null,
          status,
        },
        update: {
          name: detail.name,
          dateArgued: arguedDate,
          dateDecided: decidedDate,
          question: detail.question ?? null,
          factsOfTheCase: detail.facts_of_the_case ?? null,
          conclusion: detail.conclusion ?? null,
          majorityVotes: decision?.majority_vote ?? null,
          minorityVotes: decision?.minority_vote ?? null,
          justiaUrl: detail.justia_url ?? null,
          status,
        },
      });

      // Sync per-justice votes
      if (decision?.votes) {
        for (const vote of decision.votes) {
          const justice = await prisma.justice.findUnique({
            where: { oyezIdentifier: vote.member.identifier },
          });
          if (!justice) continue;

          await prisma.caseVote.upsert({
            where: {
              caseId_justiceId: {
                caseId: courtCase.id,
                justiceId: justice.id,
              },
            },
            create: {
              caseId: courtCase.id,
              justiceId: justice.id,
              voteType: vote.vote ?? "unknown",
              opinionType: vote.opinion_type ?? null,
              ideologyScore: vote.ideology ?? null,
            },
            update: {
              voteType: vote.vote ?? "unknown",
              opinionType: vote.opinion_type ?? null,
              ideologyScore: vote.ideology ?? null,
            },
          });
        }
      }

      synced++;
    } catch (err) {
      console.error(
        `[sync-scotus] Error syncing case ${c.docket_number}:`,
        err
      );
      errors++;
    }
  }

  return { synced, errors };
}

async function syncFinancialDisclosures(): Promise<{
  synced: number;
  errors: number;
}> {
  let synced = 0;
  let errors = 0;

  // Get all active justices that have a CourtListener ID
  const justices = await prisma.justice.findMany({
    where: { isActive: true },
    select: { id: true, courtListenerId: true, lastName: true },
  });

  for (const justice of justices) {
    if (!justice.courtListenerId) continue;

    try {
      await sleep(DELAY_MS);

      // Fetch disclosures
      const disclosures = await fetchCL<CLPaginatedResponse<CLDisclosure>>(
        `/financial-disclosures/?person=${justice.courtListenerId}&order_by=-year`
      );

      if (!disclosures?.results) continue;

      for (const d of disclosures.results.slice(0, 5)) {
        await prisma.justiceFinancialDisclosure.upsert({
          where: {
            justiceId_year_isAmended: {
              justiceId: justice.id,
              year: d.year,
              isAmended: d.is_amended,
            },
          },
          create: {
            justiceId: justice.id,
            year: d.year,
            pdfUrl: d.filepath ?? null,
            isAmended: d.is_amended,
          },
          update: {
            pdfUrl: d.filepath ?? null,
          },
        });
      }

      // Fetch gifts
      await sleep(DELAY_MS);
      const gifts = await fetchCL<CLPaginatedResponse<CLGift>>(
        `/gifts/?financial_disclosure__person=${justice.courtListenerId}`
      );

      if (gifts?.results) {
        for (const g of gifts.results) {
          // Extract year from disclosure URL or use current
          const year = new Date().getFullYear();
          await prisma.justiceGift.create({
            data: {
              justiceId: justice.id,
              source: g.source,
              description: g.description,
              value: g.value || null,
              year,
              isRedacted: g.redacted,
            },
          });
        }
      }

      // Fetch reimbursements (private jets, luxury trips, etc.)
      await sleep(DELAY_MS);
      const reimbs = await fetchCL<CLPaginatedResponse<CLReimbursement>>(
        `/reimbursements/?financial_disclosure__person=${justice.courtListenerId}`
      );

      if (reimbs?.results) {
        for (const r of reimbs.results) {
          const year = new Date().getFullYear();
          await prisma.justiceReimbursement.create({
            data: {
              justiceId: justice.id,
              source: r.source,
              location: r.location || null,
              purpose: r.purpose || null,
              itemsPaid: r.items_paid_or_provided || null,
              year,
              isRedacted: r.redacted,
            },
          });
        }
      }

      synced++;
    } catch (err) {
      console.error(
        `[sync-scotus] Error syncing disclosures for ${justice.lastName}:`,
        err
      );
      errors++;
    }
  }

  return { synced, errors };
}

// ─────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────

export async function GET() {
  try {
    console.log("[sync-scotus] Starting SCOTUS sync...");

    // Phase 1: Sync justices
    console.log("[sync-scotus] Syncing justices from Oyez...");
    const justiceResult = await syncJustices();
    console.log(
      `[sync-scotus] Justices: ${justiceResult.synced} synced, ${justiceResult.errors} errors`
    );

    // Phase 2: Sync cases for recent terms
    let totalCases = 0;
    let totalCaseErrors = 0;
    for (const term of TERMS_TO_SYNC) {
      console.log(`[sync-scotus] Syncing cases for term ${term}...`);
      const caseResult = await syncCasesForTerm(term);
      totalCases += caseResult.synced;
      totalCaseErrors += caseResult.errors;
      console.log(
        `[sync-scotus] Term ${term}: ${caseResult.synced} cases synced, ${caseResult.errors} errors`
      );
    }

    // Phase 3: Sync financial disclosures from CourtListener
    console.log("[sync-scotus] Syncing financial disclosures...");
    const disclosureResult = await syncFinancialDisclosures();
    console.log(
      `[sync-scotus] Disclosures: ${disclosureResult.synced} justices synced, ${disclosureResult.errors} errors`
    );

    return Response.json({
      success: true,
      justices: justiceResult,
      cases: { synced: totalCases, errors: totalCaseErrors },
      disclosures: disclosureResult,
    });
  } catch (error) {
    console.error("[sync-scotus] Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
