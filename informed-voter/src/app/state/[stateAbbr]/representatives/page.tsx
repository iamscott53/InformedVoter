import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import PartyBadge from "@/components/ui/PartyBadge";
import AnimatedSection from "@/components/features/AnimatedSection";
import DistrictFinder from "@/components/features/DistrictFinder";

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const MOCK_REPS = [
  { id: "rep-1",  name: "Maria Santos",    party: "D", district: 1,  region: "Northern Metro",   committees: ["Education", "Budget"],              billsSponsored: 18 },
  { id: "rep-2",  name: "James Holbrook",  party: "R", district: 2,  region: "Eastern Valley",   committees: ["Agriculture", "Veterans Affairs"],  billsSponsored: 11 },
  { id: "rep-3",  name: "Priya Kapoor",    party: "D", district: 3,  region: "Downtown Core",    committees: ["Judiciary", "Science"],             billsSponsored: 22 },
  { id: "rep-4",  name: "Thomas Wren",     party: "R", district: 4,  region: "Suburban Heights", committees: ["Armed Services", "Commerce"],       billsSponsored: 9  },
  { id: "rep-5",  name: "Aaliyah Bridges", party: "D", district: 5,  region: "Coastal District", committees: ["Natural Resources", "Foreign Affairs"], billsSponsored: 31 },
  { id: "rep-6",  name: "Kevin Stanton",   party: "R", district: 6,  region: "Rural Plains",     committees: ["Transportation", "Agriculture"],   billsSponsored: 7  },
  { id: "rep-7",  name: "Lin Mei Chen",    party: "D", district: 7,  region: "Tech Corridor",    committees: ["Science", "Small Business"],        billsSponsored: 25 },
  { id: "rep-8",  name: "Robert Okafor",   party: "I", district: 8,  region: "Central Valley",   committees: ["Oversight", "Budget"],             billsSponsored: 14 },
  { id: "rep-9",  name: "Susan Fischer",   party: "R", district: 9,  region: "Mountain West",    committees: ["Homeland Security", "Judiciary"],  billsSponsored: 16 },
  { id: "rep-10", name: "Marcus Webb",     party: "D", district: 10, region: "Harbor District",  committees: ["Transportation", "Appropriations"],billsSponsored: 20 },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}): Promise<Metadata> {
  const { stateAbbr } = await params;
  return { title: `U.S. Representatives — ${stateAbbr.toUpperCase()}` };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function RepresentativesPage({
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
            <span className="text-white/80">Representatives</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold">U.S. House Representatives</h1>
          <p className="text-white/60 mt-2">
            {abbr} has {MOCK_REPS.length} congressional districts in the House of Representatives.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* District Finder */}
        <div className="mb-10">
          <DistrictFinder />
        </div>

        {/* Party breakdown */}
        <div className="mb-8 flex items-center gap-4 flex-wrap">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Party breakdown:</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="text-sm text-gray-700 font-medium">
              Democrat: {MOCK_REPS.filter(r => r.party === "D").length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            <span className="text-sm text-gray-700 font-medium">
              Republican: {MOCK_REPS.filter(r => r.party === "R").length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
            <span className="text-sm text-gray-700 font-medium">
              Independent: {MOCK_REPS.filter(r => r.party === "I").length}
            </span>
          </div>
        </div>

        {/* Representatives grid */}
        <AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {MOCK_REPS.map((rep) => (
              <Link
                key={rep.id}
                href={`/candidate/${rep.id}`}
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Photo area */}
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-32 flex items-center justify-center">
                  <User size={48} className="text-gray-300" />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-bold bg-white/90 text-[#1B2A4A] px-2 py-1 rounded-full shadow-sm">
                      District {rep.district}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <PartyBadge party={rep.party} size="xs" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-[#1B2A4A] group-hover:text-blue-700 transition-colors">
                    {rep.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 mb-3">{rep.region}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {rep.committees.map((c) => (
                      <span key={c} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{rep.billsSponsored} bills sponsored</span>
                    <span className="text-blue-600 font-medium group-hover:underline">
                      Profile →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
