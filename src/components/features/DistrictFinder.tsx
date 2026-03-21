"use client";

import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

export default function DistrictFinder() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { district: number; rep: string }>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult({ district: 7, rep: "Lin Mei Chen" });
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#1B2A4A] mb-1 flex items-center gap-2">
        <MapPin size={18} className="text-[#C53030]" />
        Find Your District
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter your home address to find your congressional district and representative.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., 123 Main St, Sacramento, CA 95814"
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
              Looking up…
            </>
          ) : (
            "Find My District"
          )}
        </button>
      </form>

      {result && (
        <div className="mt-4 flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-lg text-sm">
          <MapPin size={16} className="text-green-600 shrink-0" />
          <p className="text-green-800">
            You are in <strong>District {result.district}</strong>, represented by{" "}
            <strong>{result.rep}</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
