import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, User, Bot, Phone, Globe } from "lucide-react";
import PartyBadge from "@/components/ui/PartyBadge";
import CandidateTabs from "@/components/features/CandidateTabs";
import type { PolicyItem } from "@/components/features/PolicyAccordion";

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_CANDIDATES: Record<string, any> = {
  "sen-dianne-feinstein": {
    id: "sen-dianne-feinstein",
    name: "Alex Rivera",
    party: "D",
    office: "U.S. Senator",
    state: "CA",
    termStart: "January 3, 2019",
    termEnd: "January 3, 2025",
    website: "#",
    phone: "(202) 224-3841",
    email: "contact@example.gov",
    bio: "Senator Alex Rivera has served California in the U.S. Senate since 2019. Before entering federal politics, Rivera served 12 years in the state assembly and was a community organizer for 10 years. Known for work on healthcare access and climate legislation.",
    policies: [
      { category: "Healthcare", summary: "Supports expanding Medicare and lowering drug prices.", details: "Co-sponsored Medicare for All legislation and the Prescription Drug Price Negotiation Act. Advocates for universal coverage as a right, not a privilege.", stance: "supports" },
      { category: "Climate", summary: "Aggressive clean energy transition advocate.", details: "Co-authored the Clean Energy Standard Act. Supports a $2 trillion clean energy investment. Rates A+ from Sierra Club.", stance: "supports" },
      { category: "Immigration", summary: "Supports pathway to citizenship for undocumented immigrants.", details: "Supports comprehensive immigration reform and DACA protections. Co-sponsored the American Dream and Promise Act.", stance: "supports" },
      { category: "Economy", summary: "Advocates for higher corporate taxes and minimum wage increase.", details: "Supports raising the federal minimum wage to $15/hour and restoring the 28% corporate tax rate. Opposes tax cuts for high earners.", stance: "supports" },
      { category: "Gun Policy", summary: "Supports expanded background checks and assault weapons ban.", details: "Voted for the Bipartisan Safer Communities Act. Supports universal background checks and magazine capacity limits.", stance: "supports" },
    ],
    votingRecord: [
      { bill: "Inflation Reduction Act", vote: "YES", date: "Aug 2022", description: "Climate, healthcare, and tax legislation" },
      { bill: "Bipartisan Infrastructure Law", vote: "YES", date: "Nov 2021", description: "$1.2T infrastructure investment" },
      { bill: "American Rescue Plan", vote: "YES", date: "Mar 2021", description: "COVID-19 relief package" },
      { bill: "CHIPS and Science Act", vote: "YES", date: "Jul 2022", description: "Domestic semiconductor manufacturing" },
      { bill: "NDAA FY2023", vote: "YES", date: "Dec 2022", description: "Defense authorization" },
      { bill: "PRO Act", vote: "YES", date: "Mar 2021", description: "Workers' right to organize" },
    ],
    campaignFinance: {
      totalRaised: 18400000,
      totalSpent: 15200000,
      cashOnHand: 3200000,
      topDonors: [
        { name: "Tech Industry PAC", amount: 850000, type: "PAC" },
        { name: "Healthcare Workers Union", amount: 620000, type: "Labor PAC" },
        { name: "Environmental Defense Fund PAC", amount: 445000, type: "PAC" },
        { name: "Individual Donors ($200+)", amount: 7200000, type: "Individual" },
        { name: "Small Donors (under $200)", amount: 5100000, type: "Individual" },
      ],
      donorTypes: [
        { type: "Individual (large)", pct: 39 },
        { type: "Individual (small)", pct: 28 },
        { type: "PACs", pct: 21 },
        { type: "Labor PACs", pct: 9 },
        { type: "Other", pct: 3 },
      ],
      spending: [
        { category: "Media & Advertising", pct: 45, amount: 6840000 },
        { category: "Staff & Consultants", pct: 28, amount: 4256000 },
        { category: "Digital/Tech", pct: 12, amount: 1824000 },
        { category: "Travel", pct: 8, amount: 1216000 },
        { category: "Events & Outreach", pct: 7, amount: 1064000 },
      ],
    },
  },
};

function getMockCandidate(id: string) {
  return MOCK_CANDIDATES[id] ?? {
    id,
    name: "Sample Candidate",
    party: "D",
    office: "U.S. Representative",
    state: "CA",
    termStart: "Jan 3, 2023",
    termEnd: "Jan 3, 2025",
    website: "#",
    phone: "(202) 000-0000",
    email: "contact@example.gov",
    bio: "Placeholder biography. Real candidate data will be populated via API.",
    policies: [
      { category: "Economy", summary: "Supports economic growth.", details: "Details about economic positions.", stance: "supports" },
    ],
    votingRecord: [],
    campaignFinance: {
      totalRaised: 0, totalSpent: 0, cashOnHand: 0,
      topDonors: [], donorTypes: [], spending: [],
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}): Promise<Metadata> {
  const { candidateId } = await params;
  const candidate = getMockCandidate(candidateId) as { name: string; office: string };
  return { title: `${candidate.name} — ${candidate.office}` };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = getMockCandidate(candidateId) as any;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B2A4A] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-white/80">Home</Link>
            <ChevronRight size={14} />
            <Link href={`/state/${candidate.state}`} className="hover:text-white/80">{candidate.state}</Link>
            <ChevronRight size={14} />
            <span className="text-white/80">{candidate.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Photo placeholder */}
            <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center ring-2 ring-white/20 shrink-0">
              <User size={44} className="text-white/40" />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-3xl sm:text-4xl font-bold">{candidate.name}</h1>
                <PartyBadge party={candidate.party} showFullName size="md" />
              </div>
              <p className="text-white/70 mb-1">
                {candidate.office} · {candidate.state}
              </p>
              <p className="text-white/50 text-sm">
                Term: {candidate.termStart} – {candidate.termEnd}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <a href={candidate.website} className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white ring-1 ring-white/20 px-3 py-1.5 rounded-full transition-colors">
                  <Globe size={12} /> Website
                </a>
                <a href={`tel:${candidate.phone}`} className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white ring-1 ring-white/20 px-3 py-1.5 rounded-full transition-colors">
                  <Phone size={12} /> {candidate.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI disclaimer */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
          <Bot size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <p>
            <strong>AI-assisted analysis:</strong> Policy summaries and voting record analysis are AI-generated and reviewed for accuracy.
            Campaign finance data sourced from FEC public filings. Always verify with official sources.{" "}
            <a href="/about#methodology" className="underline hover:text-blue-600">Learn more.</a>
          </p>
        </div>
      </div>

      {/* Bio */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Biography</h2>
          <p className="text-gray-700 leading-relaxed">{candidate.bio}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CandidateTabs candidate={candidate} />
      </div>
    </div>
  );
}
