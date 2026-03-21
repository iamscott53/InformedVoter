import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Newspaper,
  AlertCircle,
} from "lucide-react";
import StateDetector from "@/components/features/StateDetector";
import AnimatedCards from "@/components/features/AnimatedCards";

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: "InformedVoter — Know Your Vote",
  description:
    "Nonpartisan civic information for every American voter. Research candidates, track legislation, and stay informed.",
};

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    icon: "Vote",
    title: "Upcoming Elections",
    description: "See what elections are coming up in your area and what's on the ballot.",
    href: "/state/CA/elections",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: "FileText",
    title: "Active Bills",
    description: "Track federal and state legislation that affects your community.",
    href: "/state/CA/bills",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  {
    icon: "Users",
    title: "Your Representatives",
    description: "Find out who represents you in Congress and your state legislature.",
    href: "/state/CA/representatives",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: "BookOpen",
    title: "How to Vote",
    description: "Registration deadlines, polling locations, absentee ballots, and your rights.",
    href: "/state/CA/voter-info",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
];

const VOTER_ESSENTIALS = [
  {
    icon: ShieldCheck,
    title: "Your Rights at the Polls",
    description: "Know what you're entitled to as a voter and what to do if your rights are violated.",
    href: "/state/CA/voter-info#rights",
  },
  {
    icon: BarChart3,
    title: "Understanding Campaign Finance",
    description: "See who's funding political campaigns and how dark money influences elections.",
    href: "/state/CA/bills",
  },
  {
    icon: AlertCircle,
    title: "Spotting Hidden Riders",
    description: "Learn how unrelated provisions get attached to popular bills — and how to spot them.",
    href: "/state/CA/bills",
  },
  {
    icon: Newspaper,
    title: "Media Literacy for Voters",
    description: "Tips for evaluating political news and distinguishing fact from spin.",
    href: "/about",
  },
];

const US_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" }, { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
];

// ─────────────────────────────────────────────
// Page (Server Component)
// ─────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#1B2A4A] text-white">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-700/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm font-medium px-3 py-1.5 rounded-full mb-6 ring-1 ring-white/20">
              <ShieldCheck size={14} />
              100% Nonpartisan · No Ads · No Spin
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                InformedVoter
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-white/80 mb-4 leading-relaxed">
              Nonpartisan civic information for every American.
            </p>
            <p className="text-base text-white/60 mb-10 max-w-2xl leading-relaxed">
              Research your representatives, track legislation, understand what's on your ballot,
              and exercise your rights — all in one place, without partisan spin.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/state/CA"
                className="inline-flex items-center gap-2 bg-white text-[#1B2A4A] font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                Explore Your State <ArrowRight size={16} />
              </Link>
              <Link
                href="/polling-places"
                className="inline-flex items-center gap-2 bg-transparent text-white font-semibold px-6 py-3 rounded-lg ring-1 ring-white/40 hover:bg-white/10 transition-colors"
              >
                Find My Polling Place
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── State Detector ── */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StateDetector states={US_STATES} />
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B2A4A] mb-2">
              What do you need to know?
            </h2>
            <p className="text-gray-500">
              Choose a topic to get started with your state's civic information.
            </p>
          </div>

          <AnimatedCards items={QUICK_ACTIONS} />
        </div>
      </section>

      {/* ── Voter Essentials ── */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B2A4A] mb-2">
              What Every Voter Should Know
            </h2>
            <p className="text-gray-500">
              Essential knowledge for participating in American democracy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VOTER_ESSENTIALS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex flex-col gap-3 p-5 rounded-xl border border-gray-200 bg-gray-50 hover:border-[#1B2A4A]/30 hover:bg-[#1B2A4A]/5 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#1B2A4A]/10 flex items-center justify-center">
                    <Icon size={20} className="text-[#1B2A4A]" />
                  </div>
                  <h3 className="font-semibold text-[#1B2A4A] group-hover:underline leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">
                    {item.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1B2A4A]/70 group-hover:gap-2 transition-all">
                    Read more <ArrowRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Mission Banner ── */}
      <section className="bg-[#1B2A4A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-3">
            Our Commitment
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Transparent. Nonpartisan. Empowering.
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-base leading-relaxed mb-6">
            InformedVoter presents facts, context, and analysis without partisan framing.
            We use AI to summarize legislation clearly — and we always show our sources.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 font-medium text-sm"
          >
            Learn about our methodology <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
