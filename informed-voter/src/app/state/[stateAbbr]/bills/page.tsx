import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, AlertTriangle } from "lucide-react";
import BillStatusBadge from "@/components/ui/BillStatusBadge";
import { BillStatus } from "@/types";
import AnimatedSection from "@/components/features/AnimatedSection";
import BillsFilterBar from "@/components/features/BillsFilterBar";

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

export const MOCK_BILLS = [
  {
    id: "HR-1234",
    number: "H.R. 1234",
    title: "Clean Energy and Jobs Transition Act",
    status: BillStatus.IN_COMMITTEE,
    chamber: "HOUSE",
    sponsor: "Rep. Maria Santos (D-CA-1)",
    summary: "Establishes a $500 billion clean energy investment fund, creating tax incentives for renewable energy manufacturing and phasing out federal subsidies for fossil fuels over 10 years.",
    subjects: ["Energy", "Environment", "Economy"],
    hasRider: false,
    lastAction: "Referred to House Energy Committee",
    lastActionDate: "Mar 12, 2026",
  },
  {
    id: "S-567",
    number: "S. 567",
    title: "Border Security and Asylum Reform Act",
    status: BillStatus.PASSED_SENATE,
    chamber: "SENATE",
    sponsor: "Sen. Jordan Walsh (R-CA)",
    summary: "Increases border patrol funding by $8 billion, creates new fast-track asylum processing courts, and modifies asylum eligibility standards.",
    subjects: ["Immigration", "Homeland Security"],
    hasRider: true,
    riderSummary: "Contains unrelated provision limiting federal public defender funding.",
    lastAction: "Passed Senate 52-48",
    lastActionDate: "Feb 28, 2026",
  },
  {
    id: "HR-2891",
    number: "H.R. 2891",
    title: "Affordable Prescription Drug Act",
    status: BillStatus.SIGNED,
    chamber: "HOUSE",
    sponsor: "Rep. Priya Kapoor (D-CA-3)",
    summary: "Authorizes Medicare to negotiate drug prices for up to 50 additional medications per year, caps out-of-pocket drug costs for Medicare beneficiaries at $2,000 annually.",
    subjects: ["Healthcare", "Pharmaceuticals"],
    hasRider: false,
    lastAction: "Signed by President",
    lastActionDate: "Jan 15, 2026",
  },
  {
    id: "HR-4102",
    number: "H.R. 4102",
    title: "Infrastructure Modernization and Safety Act",
    status: BillStatus.PASSED_HOUSE,
    chamber: "HOUSE",
    sponsor: "Rep. Marcus Webb (D-CA-10)",
    summary: "Allocates $220 billion for highway, bridge, and rail infrastructure repair over 5 years, with emphasis on climate resilience and safety upgrades.",
    subjects: ["Transportation", "Infrastructure"],
    hasRider: true,
    riderSummary: "Section 47 contains an unrelated provision waiving environmental review requirements for certain commercial real estate projects.",
    lastAction: "Passed House 287-140",
    lastActionDate: "Mar 1, 2026",
  },
  {
    id: "S-812",
    number: "S. 812",
    title: "Small Business Tax Relief and Investment Act",
    status: BillStatus.IN_COMMITTEE,
    chamber: "SENATE",
    sponsor: "Sen. Alex Rivera (D-CA)",
    summary: "Provides tax credits for small businesses with under 100 employees that invest in employee training and equipment modernization, estimated $45 billion 10-year cost.",
    subjects: ["Economy", "Taxes", "Small Business"],
    hasRider: false,
    lastAction: "Referred to Senate Finance Committee",
    lastActionDate: "Mar 18, 2026",
  },
  {
    id: "HR-3344",
    number: "H.R. 3344",
    title: "National Defense Authorization Act FY2027",
    status: BillStatus.IN_COMMITTEE,
    chamber: "HOUSE",
    sponsor: "Rep. Thomas Wren (R-CA-4)",
    summary: "Sets defense budget at $895 billion for FY2027, increases military pay by 4.5%, funds new naval vessel construction, and expands cyber defense capabilities.",
    subjects: ["Defense", "Military", "National Security"],
    hasRider: true,
    riderSummary: "Section 1204 restricts transgender individuals from serving in certain military roles — unrelated to core defense funding.",
    lastAction: "Markup in Armed Services Committee",
    lastActionDate: "Mar 20, 2026",
  },
  {
    id: "S-991",
    number: "S. 991",
    title: "Mental Health Access and Parity Act",
    status: BillStatus.INTRODUCED,
    chamber: "SENATE",
    sponsor: "Sen. Alex Rivera (D-CA)",
    summary: "Requires insurance companies to provide equal coverage for mental health and substance use disorder treatments as they do for physical health conditions.",
    subjects: ["Healthcare", "Mental Health"],
    hasRider: false,
    lastAction: "Introduced in Senate",
    lastActionDate: "Mar 19, 2026",
  },
  {
    id: "HR-5501",
    number: "H.R. 5501",
    title: "Protecting the Right to Organize (PRO) Act",
    status: BillStatus.FAILED,
    chamber: "HOUSE",
    sponsor: "Rep. Aaliyah Bridges (D-CA-5)",
    summary: "Would have strengthened workers' rights to organize, prohibited certain union-busting tactics, and streamlined the union election process.",
    subjects: ["Labor", "Workers Rights"],
    hasRider: false,
    lastAction: "Failed: 215-220",
    lastActionDate: "Feb 14, 2026",
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}): Promise<Metadata> {
  const { stateAbbr } = await params;
  return { title: `Bills & Legislation — ${stateAbbr.toUpperCase()}` };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function BillsPage({
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
            <span className="text-white/80">Bills</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold">Bills & Legislation</h1>
          <p className="text-white/60 mt-2">
            Track federal and state bills. AI summaries highlight hidden riders and key provisions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <BillsFilterBar />

        {/* Bills list */}
        <AnimatedSection>
          <div className="mt-6 space-y-4">
            {MOCK_BILLS.map((bill) => (
              <Link
                key={bill.id}
                href={`/state/${abbr}/bills/${bill.id}`}
                className="group block bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#1B2A4A]/20 transition-all duration-200 overflow-hidden"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Bill number + status */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold bg-[#1B2A4A]/8 text-[#1B2A4A] px-2.5 py-1 rounded-md">
                        {bill.number}
                      </span>
                      <BillStatusBadge status={bill.status} size="xs" />
                    </div>

                    {/* Rider badge */}
                    {bill.hasRider && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full ring-1 ring-amber-200">
                        <AlertTriangle size={10} />
                        RIDER ALERT
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <h3 className="font-bold text-[#1B2A4A] text-base sm:text-lg group-hover:text-blue-700 transition-colors leading-snug">
                      {bill.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 mb-3">
                      Sponsored by {bill.sponsor} · {bill.chamber === "HOUSE" ? "House" : "Senate"} · Last action: {bill.lastActionDate}
                    </p>

                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                      {bill.summary}
                    </p>

                    {bill.hasRider && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                          <strong>Hidden Rider Detected:</strong> {bill.riderSummary}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {bill.subjects.map((s) => (
                          <span key={s} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-blue-600 group-hover:underline shrink-0">
                        Read More →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </AnimatedSection>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing 1–{MOCK_BILLS.length} of 211 bills
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed"
            >
              Previous
            </button>
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  page === 1
                    ? "bg-[#1B2A4A] text-white border-[#1B2A4A]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
