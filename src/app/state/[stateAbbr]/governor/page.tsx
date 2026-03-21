import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, User, ExternalLink, Star, TrendingUp } from "lucide-react";
import PartyBadge from "@/components/ui/PartyBadge";
import PolicyAccordion from "@/components/features/PolicyAccordion";
import AnimatedSection from "@/components/features/AnimatedSection";
import type { PolicyItem } from "@/components/features/PolicyAccordion";

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const MOCK_GOVERNOR = {
  id: "gov-mock",
  name: "Governor Patricia Monroe",
  party: "D",
  termStart: "January 4, 2023",
  termEnd: "January 2027",
  approvalRating: 54,
  website: "#",
  bio: "Governor Monroe took office in January 2023 after serving 12 years in the state legislature. Before entering politics, she was a public defender and civil rights attorney. She was re-elected in 2022 with 56% of the vote.",
  keyInitiatives: [
    {
      title: "CalPlan Housing Initiative",
      status: "In Progress",
      description: "A $15 billion plan to build 500,000 affordable housing units by 2028, targeting the state's housing shortage crisis.",
      statusColor: "bg-blue-100 text-blue-800",
    },
    {
      title: "Clean Transportation 2035",
      status: "Signed",
      description: "Executive order requiring all new passenger vehicles sold in the state to be zero-emission by 2035.",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      title: "Education Equity Fund",
      status: "Passed Legislature",
      description: "Increased K-12 education funding by $4.2 billion, with priority for underfunded school districts.",
      statusColor: "bg-purple-100 text-purple-800",
    },
    {
      title: "Water Security Act",
      status: "In Committee",
      description: "Comprehensive water management plan addressing drought conditions and infrastructure upgrades.",
      statusColor: "bg-amber-100 text-amber-800",
    },
  ],
  policies: [
    {
      category: "Economy & Jobs",
      summary: "Prioritizes job creation through clean energy investment and small business support.",
      details: "Signed a $2.5 billion economic relief package for small businesses. Created 45,000 new green energy jobs in the first year of her term. Advocates for raising the state minimum wage to $20/hr.",
      stance: "supports",
    },
    {
      category: "Housing",
      summary: "Strong advocate for affordable housing construction and tenant protections.",
      details: "Signed legislation fast-tracking housing permits near transit corridors. Extended the eviction moratorium while creating a landlord assistance fund. Supports inclusionary zoning at the local level.",
      stance: "supports",
    },
    {
      category: "Education",
      summary: "Supports universal pre-K and increased K-12 and community college funding.",
      details: "Launched a pilot program for free community college in 15 counties. Increased teacher salaries by 12% on average. Expanded tutoring programs post-pandemic.",
      stance: "supports",
    },
    {
      category: "Climate & Environment",
      summary: "One of the most aggressive climate agendas of any governor in the country.",
      details: "Set a target to achieve 100% clean electricity by 2045. Signed the Clean Air Accountability Act, tightening emissions standards. Banned new oil drilling permits on state-owned land.",
      stance: "supports",
    },
    {
      category: "Criminal Justice",
      summary: "Supports moderate reform including alternative sentencing and re-entry programs.",
      details: "Signed legislation reducing mandatory minimums for non-violent drug offenses. Increased funding for re-entry job training programs. Mixed record on police reform — signed some accountability measures but opposed others.",
      stance: "mixed",
    },
  ] as PolicyItem[],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}): Promise<Metadata> {
  const { stateAbbr } = await params;
  return { title: `Governor — ${stateAbbr.toUpperCase()}` };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function GovernorPage({
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-white/80">Home</Link>
            <ChevronRight size={14} />
            <Link href={`/state/${abbr}`} className="hover:text-white/80">{abbr}</Link>
            <ChevronRight size={14} />
            <span className="text-white/80">Governor</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold">Office of the Governor</h1>
          <p className="text-white/60 mt-2">
            The governor serves as the chief executive of {abbr}.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatedSection>
          <div className="space-y-8">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Photo placeholder */}
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ring-2 ring-gray-100 shrink-0 mx-auto sm:mx-0">
                    <User size={56} className="text-gray-300" />
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2 justify-center sm:justify-start">
                      <h2 className="text-2xl font-bold text-[#1B2A4A]">{MOCK_GOVERNOR.name}</h2>
                      <PartyBadge party={MOCK_GOVERNOR.party} showFullName size="md" />
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                      Term: {MOCK_GOVERNOR.termStart} – {MOCK_GOVERNOR.termEnd}
                    </p>

                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-4">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-amber-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {MOCK_GOVERNOR.approvalRating}% approval rating
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                      {MOCK_GOVERNOR.bio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="border-t border-gray-100 px-6 sm:px-8 py-4 bg-gray-50 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-600">Currently in office</span>
                </div>
                <a
                  href={MOCK_GOVERNOR.website}
                  className="inline-flex items-center gap-1.5 text-xs text-[#1B2A4A] font-medium hover:underline"
                >
                  Official Website <ExternalLink size={11} />
                </a>
                <Link
                  href={`/candidate/${MOCK_GOVERNOR.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline ml-auto"
                >
                  View Full Profile →
                </Link>
              </div>
            </div>

            {/* Key Initiatives */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-[#1B2A4A] mb-6">Key Initiatives</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_GOVERNOR.keyInitiatives.map((initiative) => (
                  <div
                    key={initiative.title}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-[#1B2A4A] text-sm leading-snug flex-1">
                        {initiative.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${initiative.statusColor}`}>
                        {initiative.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{initiative.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Policy positions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-[#1B2A4A] mb-2 flex items-center gap-2">
                <TrendingUp size={18} />
                Policy Positions
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Based on public statements, signed legislation, and official actions.
              </p>
              <PolicyAccordion policies={MOCK_GOVERNOR.policies} />
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
