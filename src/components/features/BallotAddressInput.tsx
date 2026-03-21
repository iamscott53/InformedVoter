"use client";

import { useState } from "react";
import { Search, MapPin, Loader2, ExternalLink } from "lucide-react";

const MOCK_BALLOT_ITEMS = [
  "U.S. Senate — Full Term",
  "U.S. House — District 7",
  "State Assembly — District 16",
  "Proposition 1: Affordable Housing Bond ($12B)",
  "Proposition 2: Criminal Justice Reform Act",
  "County Measure A: School Parcel Tax",
  "City Council — Seat 3",
  "Water District Board",
];

export default function BallotAddressInput() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResults(MOCK_BALLOT_ITEMS);
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <form onSubmit={handleSubmit} className="flex gap-3 flex-col sm:flex-row mb-4">
        <div className="relative flex-1">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your home address…"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30 focus:border-[#1B2A4A]/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="inline-flex items-center justify-center gap-2 bg-[#1B2A4A] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#2D4066] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Loading…
            </>
          ) : (
            <>
              <Search size={14} />
              Show My Ballot
            </>
          )}
        </button>
      </form>

      {results ? (
        <div>
          <h3 className="text-sm font-semibold text-[#1B2A4A] mb-3">
            Your ballot includes:
          </h3>
          <div className="space-y-2">
            {results.map((item) => (
              <div key={item} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B2A4A] shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Sample ballot shown. For your official ballot, visit{" "}
            <a
              href="https://www.vote.org/whats-on-my-ballot/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1B2A4A] underline hover:no-underline"
            >
              vote.org <ExternalLink size={10} className="inline" />
            </a>
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          Address is used only to look up your ballot — it is never stored.{" "}
          <a
            href="https://www.vote.org/whats-on-my-ballot/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1B2A4A] underline hover:no-underline"
          >
            Use vote.org instead <ExternalLink size={10} className="inline" />
          </a>
        </p>
      )}
    </div>
  );
}
