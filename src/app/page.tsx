import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import StateDetector from "@/components/features/StateDetector";
import { ExploreStateButton, QuickActions, VoterEssentials } from "@/components/features/HomepageLinks";

// ─────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────

export const metadata: Metadata = {
  title: "InformedVoter — Know Your Vote",
  description:
    "Nonpartisan civic information for every American voter. Research candidates, track legislation, and stay informed.",
};

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

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
              <ExploreStateButton />
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

          <QuickActions />
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

          <VoterEssentials />
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
