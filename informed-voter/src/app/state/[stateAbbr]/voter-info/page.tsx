import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  ClipboardCheck,
  Search,
  Mail,
  Bell,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Phone,
  ExternalLink,
} from "lucide-react";
import AnimatedSection from "@/components/features/AnimatedSection";
import BallotAddressInput from "@/components/features/BallotAddressInput";

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

const ACTION_CARDS = [
  {
    icon: ClipboardCheck,
    title: "Register to Vote",
    description: "Register online through the state's official portal. Takes about 5 minutes.",
    cta: "Register Now",
    href: "https://registertovote.ca.gov",
    turboVoteEmbed: false,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: Search,
    title: "Check Your Registration",
    description: "Verify your current registration status, party affiliation, and polling place.",
    cta: "Check Status",
    href: "https://voterstatus.sos.ca.gov",
    turboVoteEmbed: false,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: Mail,
    title: "Request Absentee Ballot",
    description: "Request a vote-by-mail ballot to be sent to your home address.",
    cta: "Request Ballot",
    href: "https://california.ballottrax.net",
    turboVoteEmbed: false,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  {
    icon: Bell,
    title: "Get Election Reminders",
    description: "Sign up to receive text and email reminders about upcoming deadlines and elections.",
    cta: "Set Reminders",
    href: "https://turbovote.org",
    turboVoteEmbed: true,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
];

const VOTING_RULES = [
  {
    title: "Registration Deadline",
    value: "15 days before election",
    note: "Online registration closes 15 days prior; same-day conditional registration available at polls",
    icon: Calendar,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    title: "Voter ID Requirements",
    value: "First-time voters only",
    note: "CA does not require photo ID at the polls. First-time voters who registered by mail may need to show ID.",
    icon: ShieldCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Early Voting",
    value: "Up to 29 days before election",
    note: "Vote-by-mail ballots are automatically sent to all registered voters in California.",
    icon: ClipboardCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Absentee / Vote-by-Mail",
    value: "Available to all voters",
    note: "All registered voters automatically receive a mail ballot. Drop it off or mail it back by Election Day.",
    icon: Mail,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Felony Disenfranchisement",
    value: "Rights restored after parole",
    note: "Californians with felony convictions can register and vote once they are no longer incarcerated or on parole.",
    icon: Info,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Provisional Ballots",
    value: "Available at any polling place",
    note: "If your name isn't on the voter roll, you can cast a provisional ballot. It will be counted once your eligibility is confirmed.",
    icon: CheckCircle2,
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
];

const VOTER_RIGHTS = [
  {
    right: "Right to a ballot",
    detail: "You have the right to cast a ballot if you are a registered voter in the precinct.",
  },
  {
    right: "Right to assistance",
    detail: "You may bring someone to help you vote (except your employer or union representative). Language assistance is also available.",
  },
  {
    right: "Right to a provisional ballot",
    detail: "If your name does not appear on the voter rolls, you have the right to cast a provisional ballot.",
  },
  {
    right: "Right to take your time",
    detail: "You cannot be rushed or intimidated at the polls. Election officials must allow you a reasonable time to vote.",
  },
  {
    right: "Right to a working voting machine",
    detail: "If a machine is broken, you must be offered a working machine or a paper ballot.",
  },
  {
    right: "Right to report problems",
    detail: "If you experience problems at the polls, you can call the state voter hotline or the nonpartisan Election Protection hotline: 1-866-OUR-VOTE.",
  },
  {
    right: "No electioneering near polls",
    detail: "Political campaigning, signs, and solicitation are prohibited within 100 feet of polling place entrances.",
  },
  {
    right: "Right to a receipt for mail ballots",
    detail: "You can track your vote-by-mail ballot to confirm it was received and counted.",
  },
];

const MEDIA_LITERACY_TIPS = [
  {
    icon: "🔍",
    tip: "Check the source — Is it a known news organization? A government agency? An advocacy group?",
  },
  {
    icon: "📅",
    tip: "Check the date — Old news can be shared misleadingly to seem current.",
  },
  {
    icon: "📊",
    tip: "Look for primary sources — When a story cites a study or statistic, find the original source.",
  },
  {
    icon: "🏛️",
    tip: "Compare across outlets — Read coverage from multiple sources with different perspectives.",
  },
  {
    icon: "😡",
    tip: "Be wary of emotional language — Content designed to make you angry or fearful may be manipulative.",
  },
  {
    icon: "🤖",
    tip: "Watch for AI-generated content — Verify photos and videos using reverse image search or fact-check sites.",
  },
];

const KEY_DATES = [
  { label: "Special Election", date: "Apr 15, 2026", type: "election" },
  { label: "Primary Registration Deadline", date: "May 20, 2026", type: "deadline" },
  { label: "Primary Early Voting Starts", date: "May 24, 2026", type: "voting" },
  { label: "Primary Election Day", date: "Jun 3, 2026", type: "election" },
  { label: "General Registration Deadline", date: "Oct 19, 2026", type: "deadline" },
  { label: "General Early Voting Starts", date: "Oct 5, 2026", type: "voting" },
  { label: "General Election Day", date: "Nov 3, 2026", type: "election" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}): Promise<Metadata> {
  const { stateAbbr } = await params;
  return { title: `Voter Action Center — ${stateAbbr.toUpperCase()}` };
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function VoterInfoPage({
  params,
}: {
  params: Promise<{ stateAbbr: string }>;
}) {
  const { stateAbbr } = await params;
  const abbr = stateAbbr.toUpperCase();

  const typeColors = {
    election: "bg-emerald-600",
    deadline: "bg-red-500",
    voting: "bg-blue-500",
  };

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
            <span className="text-white/80">Voter Action Center</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold">Voter Action Center</h1>
          <p className="text-white/60 mt-2">
            Everything you need to register, vote, and exercise your rights in {abbr}.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* ── Section A: Action Cards ── */}
        <AnimatedSection delay={0}>
          <section>
            <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">Take Action</h2>
            <p className="text-sm text-gray-500 mb-6">
              Quick links to official voter registration and ballot tools.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ACTION_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`flex flex-col gap-4 p-5 rounded-2xl border ${card.border} ${card.bg}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white shadow-sm`}>
                      <Icon size={20} className={card.color} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1B2A4A] text-sm mb-1">{card.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{card.description}</p>
                      {card.turboVoteEmbed && (
                        <span className="inline-block mt-2 text-[10px] font-medium bg-white/70 text-gray-500 px-2 py-0.5 rounded">
                          Powered by TurboVote
                        </span>
                      )}
                    </div>
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold ${card.color} bg-white px-3 py-2 rounded-lg hover:shadow-sm transition-shadow`}
                    >
                      {card.cta} <ExternalLink size={11} />
                    </a>
                  </div>
                );
              })}
            </div>
          </section>
        </AnimatedSection>

        {/* ── Section B: State Voting Rules ── */}
        <AnimatedSection delay={0.05}>
          <section>
            <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">{abbr} Voting Rules</h2>
            <p className="text-sm text-gray-500 mb-6">
              State-specific rules for registration, ID requirements, and voting options.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {VOTING_RULES.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.title} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${rule.bg} shrink-0`}>
                        <Icon size={16} className={rule.color} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1B2A4A] text-sm mb-0.5">{rule.title}</h3>
                        <p className={`text-sm font-bold ${rule.color} mb-1.5`}>{rule.value}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{rule.note}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </AnimatedSection>

        {/* ── Section C: Know Your Rights ── */}
        <AnimatedSection delay={0.1}>
          <section>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#1B2A4A] text-white p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={24} />
                  <div>
                    <h2 className="text-xl font-bold">Know Your Rights at the Polls</h2>
                    <p className="text-white/60 text-sm mt-0.5">
                      You have federally and state-protected rights as a voter.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {VOTER_RIGHTS.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[#1B2A4A]">{item.right}</p>
                        <p className="text-sm text-gray-500 leading-relaxed mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <Phone size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Experiencing problems at the polls?</p>
                    <p className="text-sm text-red-700 mt-0.5">
                      Call the nonpartisan Election Protection hotline:{" "}
                      <a href="tel:18664687683" className="font-bold underline hover:no-underline">
                        1-866-OUR-VOTE (687-8683)
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ── Section D: What's on My Ballot ── */}
        <AnimatedSection delay={0.15}>
          <section>
            <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">What&apos;s On My Ballot?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter your address to see your personalized sample ballot.
            </p>
            <BallotAddressInput />
          </section>
        </AnimatedSection>

        {/* ── Section E: Key Dates ── */}
        <AnimatedSection delay={0.2}>
          <section>
            <h2 className="text-xl font-bold text-[#1B2A4A] mb-2">Key Dates — 2026</h2>
            <p className="text-sm text-gray-500 mb-6">
              Important electoral deadlines and election days for {abbr} in 2026.
            </p>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="space-y-3">
                {KEY_DATES.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                    <span className={`text-xs font-bold text-white px-3 py-1 rounded-md shrink-0 min-w-[90px] text-center ${typeColors[item.type as keyof typeof typeColors]}`}>
                      {item.date.split(",")[0]}
                    </span>
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <span className="ml-auto text-xs text-gray-400 shrink-0 hidden sm:block">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* ── Section F: Media Literacy ── */}
        <AnimatedSection delay={0.25}>
          <section>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-[#1B2A4A] mb-1 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Media Literacy for Voters
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Tips for evaluating political news and protecting yourself from disinformation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MEDIA_LITERACY_TIPS.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
      </div>
    </div>
  );
}
