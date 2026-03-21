import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, AlertTriangle, ExternalLink, Bot, CheckCircle2 } from "lucide-react";
import BillStatusBadge from "@/components/ui/BillStatusBadge";
import { BillStatus } from "@/types";
import BillDetailTabs from "@/components/features/BillDetailTabs";

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const MOCK_BILL_DETAIL = {
  "HR-4102": {
    number: "H.R. 4102",
    title: "Infrastructure Modernization and Safety Act",
    status: BillStatus.PASSED_HOUSE,
    chamber: "House",
    sponsor: { name: "Rep. Marcus Webb", party: "D", district: "CA-10" },
    introducedDate: "Jan 15, 2026",
    lastActionDate: "Mar 1, 2026",
    lastAction: "Passed House 287-140",
    subjects: ["Transportation", "Infrastructure", "Climate Resilience", "Public Safety"],
    fullTextUrl: "https://congress.gov",
    aiSummary:
      "This bill appropriates $220 billion over 5 years to repair and modernize highway, bridge, and rail infrastructure across the United States. Priority is given to structures rated 'structurally deficient' by the FHWA, with climate resilience upgrades required for all federally funded projects. The bill also funds intercity passenger rail expansion and creates a new highway safety program targeting high-fatality corridors.",
    statusTimeline: [
      { label: "Introduced", date: "Jan 15, 2026", done: true },
      { label: "In Committee", date: "Jan 22, 2026", done: true },
      { label: "Committee Vote", date: "Feb 10, 2026", done: true },
      { label: "Floor Vote (House)", date: "Mar 1, 2026", done: true },
      { label: "Senate", date: "Pending", done: false },
      { label: "Presidential Action", date: "Pending", done: false },
    ],
    riders: [
      {
        id: "r1",
        severity: "red" as const,
        title: "Environmental Review Waiver for Commercial Real Estate",
        section: "Section 47, Subsection (c)",
        plainEnglish:
          "This hidden provision waives NEPA environmental review requirements for commercial real estate projects adjacent to federally funded infrastructure corridors. This means large developers could build near highways or rail lines without the normal federal environmental impact assessment, regardless of any environmental risks.",
        concern:
          "This rider is unrelated to the bill's core infrastructure purpose. It appears to benefit commercial real estate developers by exempting them from environmental protections that apply to other projects. Environmental groups have strongly opposed this provision.",
        votesFor: 3,
        votesAgainst: 12,
      },
      {
        id: "r2",
        severity: "orange" as const,
        title: "Broadened Eminent Domain Authority",
        section: "Section 112, Paragraph (4)",
        plainEnglish:
          "Expands federal eminent domain authority to allow the government to acquire private property more quickly for 'infrastructure adjacent' projects. Reduces the standard 90-day notice period to 30 days and limits property owners' ability to contest valuations.",
        concern:
          "While some expedited process may be justified, critics argue the reduced notice period and limited appeal rights are disproportionate. Property rights advocates say this could be used to acquire land for projects only loosely related to the primary infrastructure purpose.",
        votesFor: 6,
        votesAgainst: 8,
      },
      {
        id: "r3",
        severity: "yellow" as const,
        title: "Contractor Background Check Exemption",
        section: "Section 203, Clause (b)(ii)",
        plainEnglish:
          "Exempts infrastructure contractors receiving federal funds from certain background check requirements that normally apply to federal contractors, specifically regarding tax compliance history.",
        concern:
          "A relatively minor provision that loosens contractor vetting. Could allow companies with tax non-compliance history to receive federal infrastructure contracts. The exemption was not debated in committee.",
        votesFor: 9,
        votesAgainst: 5,
      },
    ],
    voteResults: {
      house: { yes: 287, no: 140, abstain: 6, total: 433 },
      partyBreakdown: {
        dem: { yes: 213, no: 8 },
        rep: { yes: 74, no: 132 },
      },
    },
  },
};

// Default fallback for any bill ID
function getMockBill(billId: string) {
  const known = MOCK_BILL_DETAIL[billId as keyof typeof MOCK_BILL_DETAIL];
  if (known) return known;
  return {
    number: billId,
    title: "Sample Legislative Act",
    status: BillStatus.IN_COMMITTEE,
    chamber: "Senate",
    sponsor: { name: "Sen. Alex Rivera", party: "D", district: "CA" },
    introducedDate: "Feb 1, 2026",
    lastActionDate: "Mar 5, 2026",
    lastAction: "In Committee",
    subjects: ["General", "Federal Policy"],
    fullTextUrl: "https://congress.gov",
    aiSummary: "This is a placeholder summary for this bill. Real data will be populated via API.",
    statusTimeline: [
      { label: "Introduced", date: "Feb 1, 2026", done: true },
      { label: "In Committee", date: "Feb 10, 2026", done: true },
      { label: "Floor Vote", date: "Pending", done: false },
      { label: "Presidential Action", date: "Pending", done: false },
    ],
    riders: [],
    voteResults: { house: { yes: 0, no: 0, abstain: 0, total: 0 }, partyBreakdown: { dem: { yes: 0, no: 0 }, rep: { yes: 0, no: 0 } } },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateAbbr: string; billId: string }>;
}): Promise<Metadata> {
  const { billId } = await params;
  const bill = getMockBill(billId);
  return { title: `${bill.number} — ${bill.title}` };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ stateAbbr: string; billId: string }>;
}) {
  const { stateAbbr, billId } = await params;
  const abbr = stateAbbr.toUpperCase();
  const bill = getMockBill(billId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B2A4A] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-white/50 text-sm mb-4 flex-wrap">
            <Link href="/" className="hover:text-white/80">Home</Link>
            <ChevronRight size={14} />
            <Link href={`/state/${abbr}`} className="hover:text-white/80">{abbr}</Link>
            <ChevronRight size={14} />
            <Link href={`/state/${abbr}/bills`} className="hover:text-white/80">Bills</Link>
            <ChevronRight size={14} />
            <span className="text-white/80">{bill.number}</span>
          </nav>

          <div className="flex flex-wrap items-start gap-3 mb-3">
            <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-md">
              {bill.number}
            </span>
            <BillStatusBadge status={bill.status} size="sm" />
            {bill.riders.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full ring-1 ring-amber-400/30">
                <AlertTriangle size={11} />
                {bill.riders.length} RIDER{bill.riders.length > 1 ? "S" : ""} DETECTED
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">{bill.title}</h1>
          <p className="text-white/60 text-sm">
            Sponsored by {bill.sponsor.name} ({bill.sponsor.party}-{bill.sponsor.district}) ·
            {" "}{bill.chamber} · Introduced {bill.introducedDate}
          </p>
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
          <Bot size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <p>
            <strong>AI-assisted analysis:</strong> Summaries and rider analysis are generated using AI and reviewed for accuracy.
            This tool is for informational purposes only. Always verify with official sources before making decisions.
            <a href="/about#methodology" className="underline ml-1 hover:text-blue-600">Learn about our methodology.</a>
          </p>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <BillDetailTabs bill={bill} />
      </div>
    </div>
  );
}
