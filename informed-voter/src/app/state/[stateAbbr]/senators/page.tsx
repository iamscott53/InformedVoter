import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, User, ExternalLink, TrendingUp } from "lucide-react";
import PartyBadge from "@/components/ui/PartyBadge";
import PolicyAccordion from "@/components/features/PolicyAccordion";
import AnimatedSection from "@/components/features/AnimatedSection";
import type { PolicyItem } from "@/components/features/PolicyAccordion";

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const MOCK_SENATORS = [
  {
    id: "sen-dianne-feinstein",
    name: "Alex Rivera",
    party: "D",
    title: "Senior Senator",
    termStart: "January 3, 2019",
    termEnd: "January 3, 2025",
    committees: ["Armed Services", "Finance", "Health"],
    votingAlignment: 92,
    billsSponsored: 47,
    website: "#",
    policies: [
      {
        category: "Healthcare",
        summary: "Supports expanding Medicare and lowering prescription drug costs.",
        details: "Has co-sponsored multiple bills to expand Medicaid eligibility and allow Medicare to negotiate drug prices. Voted in favor of the Inflation Reduction Act's drug pricing provisions.",
        stance: "supports",
      },
      {
        category: "Climate & Environment",
        summary: "Strong advocate for clean energy transition and climate legislation.",
        details: "Co-authored the Clean Energy Standard Act. Supports rejoining international climate agreements and investing $2 trillion in renewable energy infrastructure over 10 years.",
        stance: "supports",
      },
      {
        category: "Immigration",
        summary: "Favors a pathway to citizenship for undocumented immigrants.",
        details: "Supports comprehensive immigration reform including DACA protections and a 12-year pathway to citizenship. Opposes family separation policies.",
        stance: "supports",
      },
      {
        category: "Gun Policy",
        summary: "Supports background check expansion and assault weapons restrictions.",
        details: "Voted for the Bipartisan Safer Communities Act. Supports universal background checks and a federal red flag law.",
        stance: "supports",
      },
      {
        category: "Economy & Taxes",
        summary: "Advocates for raising corporate tax rate and minimum wage.",
        details: "Supports increasing the corporate tax rate to 28% and raising the federal minimum wage to $15/hour. Has voted against tax cuts that primarily benefit top earners.",
        stance: "supports",
      },
    ] as PolicyItem[],
    votingRecord: [
      { bill: "Inflation Reduction Act", vote: "YES", date: "Aug 2022" },
      { bill: "Bipartisan Infrastructure Law", vote: "YES", date: "Nov 2021" },
      { bill: "American Rescue Plan", vote: "YES", date: "Mar 2021" },
      { bill: "CHIPS and Science Act", vote: "YES", date: "Jul 2022" },
      { bill: "Defense Authorization (NDAA)", vote: "YES", date: "Dec 2022" },
    ],
  },
  {
    id: "sen-kevin-mccarthy",
    name: "Jordan Walsh",
    party: "R",
    title: "Junior Senator",
    termStart: "January 3, 2023",
    termEnd: "January 3, 2029",
    committees: ["Judiciary", "Budget", "Commerce"],
    votingAlignment: 88,
    billsSponsored: 12,
    website: "#",
    policies: [
      {
        category: "Healthcare",
        summary: "Opposes government-run healthcare; supports free-market alternatives.",
        details: "Has opposed Medicare for All proposals and the Affordable Care Act expansion. Supports health savings accounts and interstate insurance competition to lower costs.",
        stance: "opposes",
      },
      {
        category: "Climate & Environment",
        summary: "Mixed record on climate; prioritizes energy independence.",
        details: "Skeptical of aggressive climate regulations that impact energy production jobs. Has supported some renewable energy tax credits but opposed the Green New Deal.",
        stance: "mixed",
      },
      {
        category: "Immigration",
        summary: "Supports strict border enforcement and merit-based immigration.",
        details: "Advocates for completing the southern border wall, increasing immigration enforcement, and transitioning to a merit-based immigration system.",
        stance: "opposes",
      },
      {
        category: "Gun Policy",
        summary: "Supports Second Amendment rights; opposes most new gun restrictions.",
        details: "Rated A by the NRA. Opposed the Bipartisan Safer Communities Act's red flag provisions. Supports mental health reform as alternative to gun restrictions.",
        stance: "opposes",
      },
      {
        category: "Economy & Taxes",
        summary: "Advocates for lower taxes and reduced government spending.",
        details: "Supported the 2017 Tax Cuts and Jobs Act. Supports reducing the corporate tax rate and eliminating estate taxes. Advocates for balanced budget amendment.",
        stance: "supports",
      },
    ] as PolicyItem[],
    votingRecord: [
      { bill: "Inflation Reduction Act", vote: "NO", date: "Aug 2022" },
      { bill: "Bipartisan Infrastructure Law", vote: "YES", date: "Nov 2021" },
      { bill: "American Rescue Plan", vote: "NO", date: "Mar 2021" },
      { bill: "CHIPS and Science Act", vote: "YES", date: "Jul 2022" },
      { bill: "Defense Authorization (NDAA)", vote: "YES", date: "Dec 2022" },
    ],
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}): Promise<Metadata> {
  const { stateAbbr } = await params;
  return { title: `U.S. Senators — ${stateAbbr.toUpperCase()}` };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function SenatorsPage({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}) {
  const { stateAbbr } = await params;
  const abbr = stateAbbr.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B2A4A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-white/80">Home</Link>
            <ChevronRight size={14} />
            <Link href={`/state/${abbr}`} className="hover:text-white/80">{abbr}</Link>
            <ChevronRight size={14} />
            <span className="text-white/80">Senators</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold">U.S. Senators</h1>
          <p className="text-white/60 mt-2">
            {abbr} is represented by two senators in the United States Senate.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {MOCK_SENATORS.map((senator, i) => (
            <AnimatedSection key={senator.id} delay={i * 0.1}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Senator header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start gap-4">
                    {/* Photo placeholder */}
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 ring-2 ring-gray-100">
                      <User size={36} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h2 className="text-xl font-bold text-[#1B2A4A]">{senator.name}</h2>
                          <p className="text-sm text-gray-500 mt-0.5">{senator.title}</p>
                        </div>
                        <PartyBadge party={senator.party} showFullName size="md" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>Term: {senator.termStart} – {senator.termEnd}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-[#1B2A4A]">{senator.votingAlignment}%</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Party alignment</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-[#1B2A4A]">{senator.billsSponsored}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Bills sponsored</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-[#1B2A4A]">{senator.committees.length}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Committees</div>
                    </div>
                  </div>

                  {/* Committees */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {senator.committees.map((c) => (
                      <span key={c} className="text-xs bg-[#1B2A4A]/5 text-[#1B2A4A]/70 px-2.5 py-1 rounded-full font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Policy positions */}
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp size={14} />
                    Policy Positions
                  </h3>
                  <PolicyAccordion policies={senator.policies} />
                </div>

                {/* Voting record */}
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Recent Votes
                  </h3>
                  <div className="space-y-2">
                    {senator.votingRecord.map((vote) => (
                      <div
                        key={vote.bill}
                        className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-sm text-gray-700 flex-1 pr-4">{vote.bill}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-gray-400">{vote.date}</span>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              vote.vote === "YES"
                                ? "bg-green-100 text-green-800"
                                : vote.vote === "NO"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {vote.vote}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                  <a
                    href={senator.website}
                    className="inline-flex items-center gap-1.5 text-sm text-[#1B2A4A] font-medium hover:underline"
                  >
                    Official Website <ExternalLink size={12} />
                  </a>
                  <Link
                    href={`/candidate/${senator.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View Full Profile →
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </div>
  );
}
