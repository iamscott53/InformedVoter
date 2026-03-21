"use client";

import { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";

export default function BillsFilterBar() {
  const [search, setSearch] = useState("");
  const [chamber, setChamber] = useState("all");
  const [status, setStatus] = useState("all");
  const [subject, setSubject] = useState("all");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bills by keyword, number, or sponsor…"
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30 focus:border-[#1B2A4A]/50 bg-gray-50"
          />
        </div>

        {/* Filters row */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {/* Chamber */}
          <div className="relative">
            <select
              value={chamber}
              onChange={(e) => setChamber(e.target.value)}
              aria-label="Filter by chamber"
              className="appearance-none pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30 cursor-pointer text-gray-700 font-medium"
            >
              <option value="all">All Chambers</option>
              <option value="house">House</option>
              <option value="senate">Senate</option>
              <option value="state">State Legislature</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
              className="appearance-none pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30 cursor-pointer text-gray-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="introduced">Introduced</option>
              <option value="in_committee">In Committee</option>
              <option value="passed_house">Passed House</option>
              <option value="passed_senate">Passed Senate</option>
              <option value="signed">Signed</option>
              <option value="failed">Failed / Vetoed</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          {/* Subject */}
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-label="Filter by subject"
              className="appearance-none pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30 cursor-pointer text-gray-700 font-medium"
            >
              <option value="all">All Subjects</option>
              <option value="healthcare">Healthcare</option>
              <option value="economy">Economy & Taxes</option>
              <option value="environment">Environment</option>
              <option value="immigration">Immigration</option>
              <option value="defense">Defense</option>
              <option value="education">Education</option>
              <option value="transportation">Transportation</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#1B2A4A] rounded-lg hover:bg-[#2D4066] transition-colors shrink-0">
            <Filter size={13} />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
