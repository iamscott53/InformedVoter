"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Globe, ExternalLink } from "lucide-react";
import PolicyAccordion from "./PolicyAccordion";
import type { PolicyItem } from "./PolicyAccordion";

interface VoteRecord {
  bill: string;
  vote: string;
  date: string;
  description: string;
}

interface Donor {
  name: string;
  amount: number;
  type: string;
}

interface DonorTypeBreakdown {
  type: string;
  pct: number;
}

interface SpendingItem {
  category: string;
  pct: number;
  amount: number;
}

interface CampaignFinance {
  totalRaised: number;
  totalSpent: number;
  cashOnHand: number;
  topDonors: Donor[];
  donorTypes: DonorTypeBreakdown[];
  spending: SpendingItem[];
}

interface Candidate {
  name: string;
  office: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  policies: PolicyItem[];
  votingRecord: VoteRecord[];
  campaignFinance: CampaignFinance;
}

interface CandidateTabsProps {
  candidate: Candidate;
}

const TABS = ["Policy Positions", "Voting Record", "Campaign Finance", "Contact"];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const DONOR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-gray-400",
];

export default function CandidateTabs({ candidate }: CandidateTabsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const cf = candidate.campaignFinance;

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm mb-6 overflow-x-auto">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-1 min-w-max px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === i
                ? "bg-[#1B2A4A] text-white shadow-sm"
                : "text-gray-600 hover:text-[#1B2A4A] hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Policy Tab ── */}
        {activeTab === 0 && (
          <motion.div
            key="policy"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Policy Positions by Category
              </h2>
              <PolicyAccordion policies={candidate.policies as PolicyItem[]} />
            </div>
          </motion.div>
        )}

        {/* ── Voting Record Tab ── */}
        {activeTab === 1 && (
          <motion.div
            key="votes"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Voting Record — Selected Votes
              </h2>
              {candidate.votingRecord.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No voting record available.</p>
              ) : (
                <div className="space-y-2">
                  {(candidate.votingRecord as VoteRecord[]).map((vote) => (
                    <div
                      key={vote.bill}
                      className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5 ${
                          vote.vote === "YES"
                            ? "bg-green-100 text-green-800"
                            : vote.vote === "NO"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {vote.vote}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1B2A4A]">{vote.bill}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{vote.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{vote.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Campaign Finance Tab ── */}
        {activeTab === 2 && (
          <motion.div
            key="finance"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Raised", value: fmt(cf.totalRaised), color: "text-emerald-600" },
                { label: "Total Spent", value: fmt(cf.totalSpent), color: "text-red-600" },
                { label: "Cash on Hand", value: fmt(cf.cashOnHand), color: "text-blue-600" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                  <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Donor type breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Contributions by Source
              </h3>
              <div className="space-y-3">
                {cf.donorTypes.map((d, i) => (
                  <div key={d.type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{d.type}</span>
                      <span className="text-gray-500 font-bold">{d.pct}%</span>
                    </div>
                    <div className="overflow-hidden rounded-full h-2.5 bg-gray-100">
                      <div
                        className={`${DONOR_COLORS[i % DONOR_COLORS.length]} h-full rounded-full`}
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top donors */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Top Donors
              </h3>
              <div className="space-y-2">
                {cf.topDonors.map((donor) => (
                  <div key={donor.name} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#1B2A4A]">{donor.name}</p>
                      <p className="text-xs text-gray-400">{donor.type}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{fmt(donor.amount)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Source: FEC public filings. Data reflects most recent filing cycle.
              </p>
            </div>

            {/* Spending breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Spending Breakdown
              </h3>
              <div className="space-y-3">
                {cf.spending.map((item, i) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">{fmt(item.amount)}</span>
                        <span className="font-bold text-[#1B2A4A]">{item.pct}%</span>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-full h-2 bg-gray-100">
                      <div
                        className={`${DONOR_COLORS[i % DONOR_COLORS.length]} h-full rounded-full`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Contact Tab ── */}
        {activeTab === 3 && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
                Contact Information
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Phone, label: "Phone", value: candidate.phone, href: `tel:${candidate.phone}` },
                  { icon: Mail, label: "Email", value: candidate.email, href: `mailto:${candidate.email}` },
                  { icon: Globe, label: "Website", value: "Official Website", href: candidate.website },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.label === "Website" ? "_blank" : undefined}
                      rel={item.label === "Website" ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-[#1B2A4A]/5 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm ring-1 ring-black/5">
                        <Icon size={18} className="text-[#1B2A4A]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm font-semibold text-[#1B2A4A] group-hover:underline flex items-center gap-1">
                          {item.value}
                          {item.label === "Website" && <ExternalLink size={11} />}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
