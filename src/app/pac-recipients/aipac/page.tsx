import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AipacRecipientsTable from "@/components/features/AipacRecipientsTable";

export const metadata: Metadata = {
  title: "AIPAC Political Contributions to Congress | InformedVoter",
  description:
    "Members of Congress who received contributions from AIPAC and affiliated political action committees, as reported in FEC public filings.",
};

export default function AipacRecipientsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B2A4A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1.5 text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-white/80">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link href="/pac-recipients" className="hover:text-white/80">
              PAC Tracker
            </Link>
            <ChevronRight size={14} />
            <span className="text-white/80">AIPAC</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            AIPAC Contributions to Congress
          </h1>
          <p className="text-white/70 max-w-3xl leading-relaxed">
            Members of Congress who received contributions from AIPAC (American
            Israel Public Affairs Committee) and affiliated political action
            committees, as reported in Federal Election Commission public
            filings.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AipacRecipientsTable />

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-500 leading-relaxed">
          <p className="font-medium text-gray-600 mb-1">Data Source</p>
          <p>
            This page presents factual data from{" "}
            <a
              href="https://www.fec.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              Federal Election Commission
            </a>{" "}
            public filings. Political contributions are a matter of public
            record. InformedVoter does not editorialize this data.
          </p>
        </div>
      </div>
    </div>
  );
}
