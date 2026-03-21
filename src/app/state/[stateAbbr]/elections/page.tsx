import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Calendar, Vote, Clock, CheckCircle2, Circle, MapPin } from "lucide-react";
import AnimatedSection from "@/components/features/AnimatedSection";

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const MOCK_ELECTIONS = [
  {
    id: "e1",
    type: "Primary Election",
    typeColor: "bg-blue-100 text-blue-800",
    date: "June 3, 2026",
    daysUntil: 74,
    description: "Statewide primary election to determine party nominees for November general election.",
    contests: [
      "U.S. Senate (Democratic & Republican Primaries)",
      "U.S. House — All 53 Districts",
      "State Assembly — All 80 Districts",
      "State Senate — 20 Districts",
      "County Supervisor — Multiple Counties",
    ],
    registrationDeadline: "May 20, 2026",
    earlyVotingStarts: "May 24, 2026",
    absenteeDeadline: "May 26, 2026",
  },
  {
    id: "e2",
    type: "Special Election",
    typeColor: "bg-amber-100 text-amber-800",
    date: "April 15, 2026",
    daysUntil: 25,
    description: "Special election to fill a vacant seat in the 12th Congressional District.",
    contests: [
      "U.S. House — CA-12 Special Election",
    ],
    registrationDeadline: "April 1, 2026",
    earlyVotingStarts: "April 5, 2026",
    absenteeDeadline: "April 9, 2026",
  },
  {
    id: "e3",
    type: "General Election",
    typeColor: "bg-emerald-100 text-emerald-800",
    date: "November 3, 2026",
    daysUntil: 227,
    description: "General election for federal, state, and local offices. Ballot measures also included.",
    contests: [
      "U.S. Senate",
      "U.S. House — All 53 Districts",
      "Governor",
      "Attorney General",
      "State Legislature — All Seats",
      "Statewide Ballot Measures (Propositions)",
      "County & Local Races",
    ],
    registrationDeadline: "Oct 19, 2026",
    earlyVotingStarts: "Oct 5, 2026",
    absenteeDeadline: "Oct 28, 2026",
  },
];

const KEY_DATES = [
  { label: "Special Election", date: "Apr 15", color: "bg-amber-500" },
  { label: "Primary Registration Deadline", date: "May 20", color: "bg-red-500" },
  { label: "Primary Early Voting Starts", date: "May 24", color: "bg-blue-500" },
  { label: "Primary Election Day", date: "Jun 3", color: "bg-blue-700" },
  { label: "General Registration Deadline", date: "Oct 19", color: "bg-red-500" },
  { label: "General Early Voting Starts", date: "Oct 5", color: "bg-emerald-500" },
  { label: "General Election Day", date: "Nov 3", color: "bg-emerald-700" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}): Promise<Metadata> {
  const { stateAbbr } = await params;
  return { title: `Upcoming Elections — ${stateAbbr.toUpperCase()}` };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function ElectionsPage({
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
            <span className="text-white/80">Elections</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold">Upcoming Elections</h1>
          <p className="text-white/60 mt-2">
            {abbr} election calendar for 2026. Stay informed and plan ahead.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatedSection>
          <div className="space-y-8">
            {/* Elections list */}
            {MOCK_ELECTIONS.map((election) => (
              <div
                key={election.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Election header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#1B2A4A]/5 flex flex-col items-center justify-center shrink-0">
                      <Calendar size={22} className="text-[#1B2A4A]" />
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-[#1B2A4A]">{election.type}</h2>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${election.typeColor}`}>
                          {election.type}
                        </span>
                        {election.daysUntil <= 30 && (
                          <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full animate-pulse">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Clock size={14} className="text-[#1B2A4A]" />
                        <span className="font-semibold">{election.date}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{election.daysUntil} days away</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {election.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contests */}
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Vote size={13} />
                    What&apos;s on the Ballot
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {election.contests.map((contest) => (
                      <div key={contest} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        {contest}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key dates */}
                <div className="px-6 py-5 bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Key Dates
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Registration Deadline", date: election.registrationDeadline, color: "text-red-600" },
                      { label: "Early Voting Starts", date: election.earlyVotingStarts, color: "text-blue-600" },
                      { label: "Absentee Ballot Due", date: election.absenteeDeadline, color: "text-amber-600" },
                    ].map((kd) => (
                      <div key={kd.label} className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className={`text-sm font-bold ${kd.color}`}>{kd.date}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{kd.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Link
                      href={`/state/${abbr}/voter-info`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B2A4A] hover:text-blue-700"
                    >
                      Register to Vote →
                    </Link>
                    <Link
                      href="/polling-places"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1B2A4A]"
                    >
                      <MapPin size={13} />
                      Find Polling Place
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Key dates calendar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1B2A4A] mb-5 flex items-center gap-2">
                <Calendar size={18} />
                2026 Election Calendar
              </h2>
              <div className="space-y-3">
                {KEY_DATES.map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md text-white ${item.color} w-16 text-center shrink-0`}>
                      {item.date}
                    </span>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
