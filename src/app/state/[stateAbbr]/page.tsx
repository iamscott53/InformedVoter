import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Building2,
  FileText,
  Landmark,
  Vote,
  BookOpen,
  DollarSign,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import AnimatedSection from "@/components/features/AnimatedSection";

// ─────────────────────────────────────────────
// Types & mock data helpers
// ─────────────────────────────────────────────

const STATE_DATA: Record<string, { name: string; capital: string; population: string }> = {
  AL: { name: "Alabama",        capital: "Montgomery",   population: "5.1M" },
  AK: { name: "Alaska",         capital: "Juneau",       population: "730K" },
  AZ: { name: "Arizona",        capital: "Phoenix",      population: "7.4M" },
  AR: { name: "Arkansas",       capital: "Little Rock",  population: "3.0M" },
  CA: { name: "California",     capital: "Sacramento",   population: "39.5M" },
  CO: { name: "Colorado",       capital: "Denver",       population: "5.8M" },
  CT: { name: "Connecticut",    capital: "Hartford",     population: "3.6M" },
  DE: { name: "Delaware",       capital: "Dover",        population: "990K" },
  FL: { name: "Florida",        capital: "Tallahassee",  population: "22.6M" },
  GA: { name: "Georgia",        capital: "Atlanta",      population: "11.0M" },
  HI: { name: "Hawaii",         capital: "Honolulu",     population: "1.4M" },
  ID: { name: "Idaho",          capital: "Boise",        population: "1.9M" },
  IL: { name: "Illinois",       capital: "Springfield",  population: "12.6M" },
  IN: { name: "Indiana",        capital: "Indianapolis", population: "6.8M" },
  IA: { name: "Iowa",           capital: "Des Moines",   population: "3.2M" },
  KS: { name: "Kansas",         capital: "Topeka",       population: "2.9M" },
  KY: { name: "Kentucky",       capital: "Frankfort",    population: "4.5M" },
  LA: { name: "Louisiana",      capital: "Baton Rouge",  population: "4.6M" },
  ME: { name: "Maine",          capital: "Augusta",      population: "1.4M" },
  MD: { name: "Maryland",       capital: "Annapolis",    population: "6.2M" },
  MA: { name: "Massachusetts",  capital: "Boston",       population: "7.0M" },
  MI: { name: "Michigan",       capital: "Lansing",      population: "10.1M" },
  MN: { name: "Minnesota",      capital: "Saint Paul",   population: "5.7M" },
  MS: { name: "Mississippi",    capital: "Jackson",      population: "3.0M" },
  MO: { name: "Missouri",       capital: "Jefferson City",population: "6.2M" },
  MT: { name: "Montana",        capital: "Helena",       population: "1.1M" },
  NE: { name: "Nebraska",       capital: "Lincoln",      population: "2.0M" },
  NV: { name: "Nevada",         capital: "Carson City",  population: "3.2M" },
  NH: { name: "New Hampshire",  capital: "Concord",      population: "1.4M" },
  NJ: { name: "New Jersey",     capital: "Trenton",      population: "9.3M" },
  NM: { name: "New Mexico",     capital: "Santa Fe",     population: "2.1M" },
  NY: { name: "New York",       capital: "Albany",       population: "19.8M" },
  NC: { name: "North Carolina", capital: "Raleigh",      population: "10.7M" },
  ND: { name: "North Dakota",   capital: "Bismarck",     population: "780K" },
  OH: { name: "Ohio",           capital: "Columbus",     population: "11.8M" },
  OK: { name: "Oklahoma",       capital: "Oklahoma City",population: "4.0M" },
  OR: { name: "Oregon",         capital: "Salem",        population: "4.3M" },
  PA: { name: "Pennsylvania",   capital: "Harrisburg",   population: "13.0M" },
  RI: { name: "Rhode Island",   capital: "Providence",   population: "1.1M" },
  SC: { name: "South Carolina", capital: "Columbia",     population: "5.3M" },
  SD: { name: "South Dakota",   capital: "Pierre",       population: "910K" },
  TN: { name: "Tennessee",      capital: "Nashville",    population: "7.1M" },
  TX: { name: "Texas",          capital: "Austin",       population: "30.5M" },
  UT: { name: "Utah",           capital: "Salt Lake City",population: "3.4M" },
  VT: { name: "Vermont",        capital: "Montpelier",   population: "645K" },
  VA: { name: "Virginia",       capital: "Richmond",     population: "8.7M" },
  WA: { name: "Washington",     capital: "Olympia",      population: "7.8M" },
  WV: { name: "West Virginia",  capital: "Charleston",   population: "1.8M" },
  WI: { name: "Wisconsin",      capital: "Madison",      population: "5.9M" },
  WY: { name: "Wyoming",        capital: "Cheyenne",     population: "580K" },
};

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}): Promise<Metadata> {
  const { stateAbbr } = await params;
  const state = STATE_DATA[stateAbbr.toUpperCase()];
  const stateName = state?.name ?? stateAbbr.toUpperCase();
  return {
    title: `${stateName} Voter Dashboard`,
    description: `Civic information for ${stateName}: senators, representatives, bills, elections, and voter resources.`,
  };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function StateDashboardPage({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}) {
  const { stateAbbr } = await params;
  const abbr = stateAbbr.toUpperCase();
  const state = STATE_DATA[abbr] ?? { name: abbr, capital: "—", population: "—" };

  const sections = [
    {
      icon: UserCheck,
      title: "U.S. Senators",
      description: "2 senators representing your state in Washington",
      href: `/state/${abbr}/senators`,
      count: "2 Senators",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      icon: Users,
      title: "U.S. Representatives",
      description: "Your House representatives in Congress",
      href: `/state/${abbr}/representatives`,
      count: "53 Districts",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      icon: Building2,
      title: "Governor",
      description: "The current governor of " + state.name,
      href: `/state/${abbr}/governor`,
      count: "1 Official",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      icon: FileText,
      title: "Federal Bills",
      description: "Active legislation in Congress affecting your state",
      href: `/state/${abbr}/bills?chamber=federal`,
      count: "124 Active",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
    {
      icon: Landmark,
      title: "State Bills",
      description: "Bills moving through the state legislature",
      href: `/state/${abbr}/bills?chamber=state`,
      count: "87 Active",
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      icon: Vote,
      title: "Upcoming Elections",
      description: "Scheduled elections and what's on the ballot",
      href: `/state/${abbr}/elections`,
      count: "3 Upcoming",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      icon: BookOpen,
      title: "Voter Action Center",
      description: "Register, check status, absentee ballots, and your rights",
      href: `/state/${abbr}/voter-info`,
      count: "6 Sections",
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
    },
    {
      icon: DollarSign,
      title: "Campaign Finance",
      description: "Who is funding campaigns and how money flows in elections",
      href: `/state/${abbr}/bills`,
      count: "Data Available",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
      <div className="bg-[#1B2A4A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-white/50 text-sm mb-6">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white/80">{state.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl font-black text-white/20 select-none">{abbr}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                {state.name} Voter Dashboard
              </h1>
              <p className="text-white/60 mt-2 text-sm">
                Capital: {state.capital} · Population: {state.population}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/state/${abbr}/voter-info`}
                className="inline-flex items-center gap-2 bg-white text-[#1B2A4A] font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Register to Vote <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dashboard Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-sm text-gray-500 mb-8 font-medium uppercase tracking-wider">
          Explore {state.name} Civic Information
        </p>

        <AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className={`group flex flex-col gap-4 p-6 rounded-2xl border ${section.border} ${section.bg} bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white shadow-sm ring-1 ring-black/5`}>
                      <Icon size={20} className={section.color} />
                    </div>
                    <span className={`text-xs font-semibold ${section.color} bg-white px-2 py-1 rounded-full ring-1 ring-current/20`}>
                      {section.count}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#1B2A4A] text-base mb-1">
                      {section.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${section.color} group-hover:gap-2 transition-all`}>
                    View Details <ArrowRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        </AnimatedSection>

        {/* ── Quick Stats Bar ── */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
            At a Glance — {state.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-gray-100">
            {[
              { label: "Active Bills",      value: "211" },
              { label: "Elected Officials", value: "55+" },
              { label: "Upcoming Elections",value: "3"   },
              { label: "Registered Voters", value: "22M" },
            ].map((stat) => (
              <div key={stat.label} className="pl-6 first:pl-0">
                <div className="text-2xl font-bold text-[#1B2A4A]">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
