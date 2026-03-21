"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Minus, ChevronDown, Plus, User } from "lucide-react";
import PartyBadge from "@/components/ui/PartyBadge";
import Link from "next/link";

// ─────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────

interface CandidatePolicy {
  stance: "supports" | "opposes" | "neutral" | "mixed";
  summary: string;
}

interface MockCandidate {
  id: string;
  name: string;
  party: "D" | "R" | "I";
  office: string;
  state: string;
  policies: Record<string, CandidatePolicy>;
}

const MOCK_CANDIDATES: MockCandidate[] = [
  {
    id: "sen-dianne-feinstein",
    name: "Alex Rivera",
    party: "D",
    office: "U.S. Senator",
    state: "CA",
    policies: {
      "Healthcare": { stance: "supports", summary: "Supports Medicare expansion and drug price negotiation." },
      "Climate & Environment": { stance: "supports", summary: "Advocates for aggressive clean energy transition and net-zero by 2050." },
      "Immigration": { stance: "supports", summary: "Supports pathway to citizenship and DACA protections." },
      "Gun Policy": { stance: "supports", summary: "Supports universal background checks and assault weapons restrictions." },
      "Economy & Taxes": { stance: "supports", summary: "Supports raising corporate tax rate to 28% and $15 minimum wage." },
      "Criminal Justice": { stance: "mixed", summary: "Supports some reform; mixed record on police accountability measures." },
      "Education": { stance: "supports", summary: "Supports universal pre-K, student loan reform, and increased K-12 funding." },
      "Foreign Policy": { stance: "supports", summary: "Supports multilateral engagement and NATO commitments." },
    },
  },
  {
    id: "sen-kevin-mccarthy",
    name: "Jordan Walsh",
    party: "R",
    office: "U.S. Senator",
    state: "CA",
    policies: {
      "Healthcare": { stance: "opposes", summary: "Opposes government-run healthcare. Supports free-market alternatives and HSAs." },
      "Climate & Environment": { stance: "mixed", summary: "Skeptical of regulations impacting energy jobs; supports some renewable tax credits." },
      "Immigration": { stance: "opposes", summary: "Supports strict border enforcement and merit-based system." },
      "Gun Policy": { stance: "opposes", summary: "Opposes most new gun restrictions. Supports Second Amendment rights." },
      "Economy & Taxes": { stance: "supports", summary: "Supports lower corporate taxes, deregulation, and balanced budget." },
      "Criminal Justice": { stance: "opposes", summary: "Opposes defunding police. Supports law and order approach." },
      "Education": { stance: "opposes", summary: "Supports school choice and opposes federal student loan forgiveness." },
      "Foreign Policy": { stance: "neutral", summary: "Supports strong military but skeptical of multilateral commitments and foreign aid." },
    },
  },
];

const AVAILABLE_CANDIDATES = [
  { id: "sen-dianne-feinstein", name: "Alex Rivera", party: "D", office: "U.S. Senator" },
  { id: "sen-kevin-mccarthy", name: "Jordan Walsh", party: "R", office: "U.S. Senator" },
  { id: "rep-1", name: "Maria Santos", party: "D", office: "U.S. Rep. CA-1" },
  { id: "rep-2", name: "James Holbrook", party: "R", office: "U.S. Rep. CA-2" },
];

const POLICY_CATEGORIES = [
  "Healthcare",
  "Climate & Environment",
  "Immigration",
  "Gun Policy",
  "Economy & Taxes",
  "Criminal Justice",
  "Education",
  "Foreign Policy",
];

const STANCE_ICONS = {
  supports: { icon: Check, color: "text-emerald-600", bg: "bg-emerald-50", label: "Supports" },
  opposes: { icon: X, color: "text-red-600", bg: "bg-red-50", label: "Opposes" },
  neutral: { icon: Minus, color: "text-gray-500", bg: "bg-gray-50", label: "Neutral" },
  mixed: { icon: Minus, color: "text-amber-600", bg: "bg-amber-50", label: "Mixed" },
};

export default function CompareTable() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["sen-dianne-feinstein", "sen-kevin-mccarthy"]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const selectedCandidates = MOCK_CANDIDATES.filter((c) => selectedIds.includes(c.id));

  function toggleCandidate(id: string) {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) setSelectedIds(selectedIds.filter((s) => s !== id));
    } else if (selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  }

  return (
    <div className="space-y-6">
      {/* Candidate selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Select Candidates to Compare (2–4)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AVAILABLE_CANDIDATES.map((c) => {
            const selected = selectedIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCandidate(c.id)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${
                  selected
                    ? "border-[#1B2A4A] bg-[#1B2A4A]/5"
                    : "border-gray-200 hover:border-[#1B2A4A]/30 hover:bg-gray-50"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selected ? "bg-[#1B2A4A]" : "bg-gray-100"}`}>
                  <User size={18} className={selected ? "text-white" : "text-gray-400"} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1B2A4A] leading-tight">{c.name}</p>
                  <p className="text-[10px] text-gray-400">{c.office}</p>
                </div>
                <PartyBadge party={c.party} size="xs" />
                {selected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#1B2A4A] rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {selectedIds.length < 2 ? "Select at least 2 candidates to compare." : `Comparing ${selectedIds.length} candidates.`}
        </p>
      </div>

      {/* Comparison table */}
      {selectedCandidates.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Header row */}
          <div className={`grid gap-px bg-gray-100`} style={{ gridTemplateColumns: `1fr repeat(${selectedCandidates.length}, 1fr)` }}>
            <div className="bg-[#1B2A4A] p-4">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Issue</p>
            </div>
            {selectedCandidates.map((c) => (
              <div key={c.id} className="bg-[#1B2A4A] p-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <User size={15} className="text-white/60" />
                  </div>
                  <p className="text-sm font-bold text-white leading-tight">{c.name}</p>
                  <PartyBadge party={c.party} size="xs" showFullName />
                  <p className="text-[10px] text-white/50">{c.office}</p>
                  <Link
                    href={`/candidate/${c.id}`}
                    className="text-[10px] text-blue-300 hover:text-blue-200 underline"
                  >
                    Full Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Policy rows */}
          {POLICY_CATEGORIES.map((category) => {
            const isExpanded = expandedCategory === category;

            return (
              <div key={category} className="border-b border-gray-100 last:border-0">
                {/* Row */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="w-full"
                  aria-expanded={isExpanded}
                >
                  <div className={`grid gap-px bg-gray-100`} style={{ gridTemplateColumns: `1fr repeat(${selectedCandidates.length}, 1fr)` }}>
                    {/* Category label */}
                    <div className="bg-white p-4 flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#1B2A4A] text-left">{category}</span>
                      <ChevronDown
                        size={14}
                        className={`text-gray-400 ml-auto shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>

                    {/* Each candidate's stance */}
                    {selectedCandidates.map((c) => {
                      const policy = c.policies[category];
                      if (!policy) return (
                        <div key={c.id} className="bg-white p-4 flex items-center justify-center">
                          <Minus size={16} className="text-gray-300" />
                        </div>
                      );
                      const config = STANCE_ICONS[policy.stance];
                      const Icon = config.icon;
                      return (
                        <div key={c.id} className={`${config.bg} p-4 flex flex-col items-center gap-1 text-center`}>
                          <div className={`w-7 h-7 rounded-full bg-white/70 flex items-center justify-center`}>
                            <Icon size={15} className={config.color} />
                          </div>
                          <span className={`text-[10px] font-bold ${config.color}`}>{config.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className={`grid bg-gray-50`} style={{ gridTemplateColumns: `1fr repeat(${selectedCandidates.length}, 1fr)` }}>
                    <div className="p-4" />
                    {selectedCandidates.map((c) => {
                      const policy = c.policies[category];
                      return (
                        <div key={c.id} className="p-4 border-l border-gray-100">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {policy?.summary ?? "No data available."}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap text-xs font-medium">
        <span className="text-gray-400 uppercase tracking-wider text-[10px]">Legend:</span>
        {Object.entries(STANCE_ICONS).map(([key, val]) => {
          const Icon = val.icon;
          return (
            <span key={key} className="flex items-center gap-1.5">
              <Icon size={13} className={val.color} />
              {val.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
