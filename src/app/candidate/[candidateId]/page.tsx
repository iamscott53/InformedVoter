import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, User, Bot, Phone, Globe } from "lucide-react";
import PartyBadge from "@/components/ui/PartyBadge";
import CandidateTabs from "@/components/features/CandidateTabs";
import { prisma } from "@/lib/db";
import { OfficeType } from "@/types";

// ─────────────────────────────────────────────
// Helper: human-readable office title
// ─────────────────────────────────────────────

function officeLabel(type: OfficeType, district?: string | null): string {
  switch (type) {
    case OfficeType.PRESIDENT:        return "President of the United States";
    case OfficeType.US_SENATOR:       return "U.S. Senator";
    case OfficeType.US_REPRESENTATIVE:
      return district ? `U.S. Representative — District ${district}` : "U.S. Representative";
    case OfficeType.GOVERNOR:         return "Governor";
    case OfficeType.STATE_SENATOR:    return district ? `State Senator — District ${district}` : "State Senator";
    case OfficeType.STATE_REP:        return district ? `State Representative — District ${district}` : "State Representative";
    default:                          return "Elected Official";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}): Promise<Metadata> {
  const { candidateId } = await params;
  const idNum = parseInt(candidateId, 10);
  if (isNaN(idNum)) return { title: "Candidate Not Found" };
  const candidate = await prisma.candidate.findUnique({
    where: { id: idNum },
    select: { name: true, officeType: true, district: true },
  });
  if (!candidate) return { title: "Candidate Not Found" };
  return { title: `${candidate.name} — ${officeLabel(candidate.officeType as OfficeType, candidate.district)}` };
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
  const idNum = parseInt(candidateId, 10);
  if (isNaN(idNum)) notFound();

  const candidate = await prisma.candidate.findUnique({
    where: { id: idNum },
    include: {
      state: { select: { abbreviation: true, name: true } },
      policies: { orderBy: { category: "asc" } },
      billVotes: {
        include: { bill: { select: { id: true, title: true, externalId: true } } },
        orderBy: { voteDate: "desc" },
        take: 20,
      },
      finance: {
        orderBy: { cycle: "desc" },
        take: 1,
        include: {
          topDonors: { orderBy: { totalAmount: "desc" }, take: 5 },
          expenditures: { orderBy: { totalAmount: "desc" }, take: 5 },
        },
      },
    },
  });

  if (!candidate) notFound();

  const stateAbbr = candidate.state?.abbreviation ?? "US";
  const office = officeLabel(candidate.officeType as OfficeType, candidate.district);
  const contactInfo = candidate.contactInfo as Record<string, string> | null ?? {};
  const socialMedia = candidate.socialMedia as Record<string, string> | null ?? {};

  // Map policies to PolicyItem shape
  const policies = candidate.policies.map((p) => ({
    category: p.category,
    summary: p.summary,
    details: p.supportersPerspective ?? p.aiAnalysis ?? "",
    stance: "supports" as const,
  }));

  // Map voting record
  const votingRecord = candidate.billVotes.map((bv) => ({
    bill: bv.bill.title,
    vote: bv.vote,
    date: bv.voteDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    description: `${bv.bill.externalId}`,
  }));

  // Map finance data
  const latestFinance = candidate.finance[0] ?? null;
  const campaignFinance = {
    totalRaised: latestFinance ? Number(latestFinance.totalRaised) : 0,
    totalSpent: latestFinance ? Number(latestFinance.totalSpent) : 0,
    cashOnHand: latestFinance ? Number(latestFinance.cashOnHand) : 0,
    topDonors: latestFinance
      ? latestFinance.topDonors.map((d) => ({
          name: d.donorName,
          amount: Number(d.totalAmount),
          type: d.donorType,
        }))
      : [],
    donorTypes: latestFinance
      ? (() => {
          const total = Number(latestFinance.individualContributions) +
            Number(latestFinance.pacContributions) +
            Number(latestFinance.partyContributions) +
            Number(latestFinance.selfFunding);
          if (total === 0) return [];
          return [
            { type: "Individual", pct: Math.round((Number(latestFinance.individualContributions) / total) * 100) },
            { type: "PAC", pct: Math.round((Number(latestFinance.pacContributions) / total) * 100) },
            { type: "Party", pct: Math.round((Number(latestFinance.partyContributions) / total) * 100) },
            { type: "Self-Funding", pct: Math.round((Number(latestFinance.selfFunding) / total) * 100) },
          ].filter((d) => d.pct > 0);
        })()
      : [],
    spending: latestFinance
      ? latestFinance.expenditures.map((e) => {
          const pct = Number(latestFinance.totalSpent) > 0
            ? Math.round((Number(e.totalAmount) / Number(latestFinance.totalSpent)) * 100)
            : 0;
          return { category: e.purpose ?? e.category, pct, amount: Number(e.totalAmount) };
        })
      : [],
  };

  // Shape for CandidateTabs
  const candidateForTabs = {
    name: candidate.name,
    office,
    state: stateAbbr,
    phone: contactInfo.phone ?? socialMedia.phone ?? "",
    email: contactInfo.email ?? "",
    website: candidate.websiteUrl ?? contactInfo.website ?? "#",
    policies,
    votingRecord,
    campaignFinance,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B2A4A] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-white/80">Home</Link>
            <ChevronRight size={14} />
            <Link href={`/state/${stateAbbr}`} className="hover:text-white/80">{stateAbbr}</Link>
            <ChevronRight size={14} />
            <span className="text-white/80">{candidate.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Photo */}
            <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center ring-2 ring-white/20 shrink-0 overflow-hidden">
              {candidate.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={candidate.photoUrl} alt={candidate.name} className="w-full h-full object-cover" />
              ) : (
                <User size={44} className="text-white/40" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-3xl sm:text-4xl font-bold">{candidate.name}</h1>
                <PartyBadge party={candidate.party} showFullName size="md" />
              </div>
              <p className="text-white/70 mb-1">
                {office} · {stateAbbr}
              </p>
              {candidate.incumbentSince && (
                <p className="text-white/50 text-sm">
                  In office since:{" "}
                  {candidate.incumbentSince.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {candidate.termEnds && (
                    <> · Term ends: {candidate.termEnds.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</>
                  )}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                {(candidate.websiteUrl ?? contactInfo.website) && (
                  <a
                    href={candidate.websiteUrl ?? contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white ring-1 ring-white/20 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Globe size={12} /> Website
                  </a>
                )}
                {contactInfo.phone && (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white ring-1 ring-white/20 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Phone size={12} /> {contactInfo.phone}
                  </a>
                )}
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
      {candidate.biography && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Biography</h2>
            <p className="text-gray-700 leading-relaxed">{candidate.biography}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CandidateTabs candidate={candidateForTabs} />
      </div>
    </div>
  );
}
