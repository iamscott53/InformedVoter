import type { Metadata } from "next";
import Link from "next/link";
import { DollarSign, ArrowRight, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "PAC Tracker — Political Action Committee Contributions | InformedVoter",
  description:
    "Track political action committee (PAC) contributions to members of Congress using FEC public filings.",
};

const FEATURED_PACS = [
  {
    name: "AIPAC",
    description:
      "American Israel Public Affairs Committee — one of the largest PACs contributing to Congressional campaigns.",
    href: "/pac-recipients/aipac",
  },
];

export default function PacRecipientsIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1B2A4A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-white/80">
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-white/80">PAC Tracker</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            PAC Tracker
          </h1>
          <p className="text-white/70 max-w-3xl leading-relaxed">
            Track political action committee contributions to members of
            Congress. All data comes from Federal Election Commission public
            filings.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-xl font-bold text-[#1B2A4A] mb-6">
          Featured PAC Reports
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_PACS.map((pac) => (
            <Link
              key={pac.name}
              href={pac.href}
              className="group flex flex-col gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:border-[#1B2A4A]/30 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1B2A4A]/10 flex items-center justify-center">
                <DollarSign size={20} className="text-[#1B2A4A]" />
              </div>
              <h3 className="text-lg font-bold text-[#1B2A4A] group-hover:underline">
                {pac.name}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed flex-1">
                {pac.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[#1B2A4A]/70 group-hover:gap-2 transition-all">
                View report <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>

        {/* How PACs work */}
        <div className="mt-12 p-6 bg-white rounded-xl border border-gray-200">
          <h2 className="text-lg font-bold text-[#1B2A4A] mb-3">
            How PAC Contributions Work
          </h2>
          <div className="prose prose-sm text-gray-600 max-w-none">
            <p>
              A <strong>Political Action Committee (PAC)</strong> is an
              organization that raises money to support or oppose candidates for
              office. PACs are required to register with the Federal Election
              Commission and disclose all contributions.
            </p>
            <p>
              <strong>Traditional PACs</strong> can contribute directly to
              candidates (up to $5,000 per candidate per election).{" "}
              <strong>Super PACs</strong> can raise and spend unlimited amounts
              but cannot contribute directly to candidates or coordinate with
              their campaigns.
            </p>
            <p>
              All data on this page comes from{" "}
              <a
                href="https://www.fec.gov"
                target="_blank"
                rel="noopener noreferrer"
              >
                FEC public filings
              </a>
              . Contributions are a matter of public record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
