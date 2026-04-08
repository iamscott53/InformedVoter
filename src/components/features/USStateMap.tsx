"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Search, ChevronDown } from "lucide-react";
import { useUserState } from "@/hooks/useUserState";
import { US_STATES } from "@/data/us-states";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface USStateMapProps {
  variant?: "light" | "dark";
  showDetectionBanner?: boolean;
}

// ─────────────────────────────────────────────
// Sorted state list for the dropdown
// ─────────────────────────────────────────────

const STATES_SORTED = Object.values(US_STATES).sort((a, b) =>
  a.name.localeCompare(b.name)
);

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function USStateMap({
  variant = "light",
  showDetectionBanner = false,
}: USStateMapProps) {
  const router = useRouter();
  const { userState, setUserState, isLoading } = useUserState();
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = variant === "dark";
  const detectedName = userState ? US_STATES[userState]?.name : null;
  const hoveredInfo = hoveredState ? US_STATES[hoveredState] : null;

  const filteredStates = search.trim()
    ? STATES_SORTED.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.abbr.toLowerCase().includes(search.toLowerCase())
      )
    : STATES_SORTED;

  const handleStateClick = useCallback(
    (abbr: string) => {
      setUserState(abbr);
      router.push(`/state/${abbr.toLowerCase()}`);
    },
    [router, setUserState]
  );

  const handleDropdownSelect = useCallback(
    (abbr: string) => {
      setUserState(abbr);
      setIsDropdownOpen(false);
      setSearch("");
      router.push(`/state/${abbr.toLowerCase()}`);
    },
    [router, setUserState]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDropdownOpen]);

  return (
    <div className="relative w-full">
      {/* Detection banner */}
      {showDetectionBanner && (
        <div className="mb-4 text-center">
          {isLoading ? (
            <div className="inline-flex items-center gap-2 text-white/60">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm font-medium">
                Detecting your state...
              </span>
            </div>
          ) : detectedName ? (
            <div className="inline-flex items-center gap-2">
              <MapPin
                size={16}
                className={isDark ? "text-blue-400" : "text-[#1B2A4A]"}
              />
              <span
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#1B2A4A]"}`}
              >
                We detected you&apos;re in{" "}
                <span className={isDark ? "text-blue-300" : "text-blue-600"}>
                  {detectedName}
                </span>
              </span>
              <span className={isDark ? "text-white/30" : "text-gray-300"}>
                |
              </span>
              <span
                className={`text-xs ${isDark ? "text-white/50" : "text-gray-400"}`}
              >
                Click any state on the map or use the selector below
              </span>
            </div>
          ) : (
            <p
              className={`text-sm font-medium ${isDark ? "text-white/60" : "text-gray-500"}`}
            >
              Click any state on the map to explore civic information
            </p>
          )}
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredInfo && (
        <div
          className="fixed z-50 px-3 py-1.5 bg-[#1B2A4A] text-white text-sm font-medium rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          {hoveredInfo.name}
        </div>
      )}

      {/* SVG Map — accurate Census Bureau boundaries */}
      <div
        className={`rounded-xl overflow-hidden ${isDark ? "bg-white/95" : "bg-white shadow-sm ring-1 ring-gray-200"} p-3 sm:p-4`}
        onMouseMove={handleMouseMove}
      >
        <svg
          viewBox="0 0 960 600"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Interactive map of the United States. Click a state to view its information."
        >
          {Object.entries(US_STATES).map(([abbr, state]) => {
            const isSelected = userState === abbr;
            const isHovered = hoveredState === abbr;

            let fill = "#FFFFFF";
            let stroke = "#333333";
            let strokeWidth = 0.8;

            if (isSelected) {
              fill = "#22C55E";
              stroke = "#15803D";
              strokeWidth = 1.8;
            } else if (isHovered) {
              fill = "#D1D5DB";
              stroke = "#4B5563";
              strokeWidth = 1.2;
            }

            return (
              <path
                key={abbr}
                d={state.d}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                className="cursor-pointer transition-colors duration-150"
                onClick={() => handleStateClick(abbr)}
                onMouseEnter={() => setHoveredState(abbr)}
                onMouseLeave={() => setHoveredState(null)}
                role="button"
                aria-label={state.name}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleStateClick(abbr);
                  }
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* State selector dropdown — for small states or mobile */}
      <div className="mt-3" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? "bg-white/10 hover:bg-white/15 text-white ring-1 ring-white/20"
              : "bg-white hover:bg-gray-50 text-[#1B2A4A] ring-1 ring-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="opacity-50" />
            <span>
              {userState
                ? `${US_STATES[userState]?.name ?? userState} — Click to change`
                : "Or search for your state..."}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isDropdownOpen && (
          <div
            className={`absolute z-50 mt-1 w-full rounded-lg shadow-xl overflow-hidden ${
              isDark
                ? "bg-[#1B2A4A] ring-1 ring-white/20"
                : "bg-white ring-1 ring-gray-200"
            }`}
          >
            <div className="p-2">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                  isDark ? "bg-white/10" : "bg-gray-100"
                }`}
              >
                <Search size={14} className="opacity-40 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search states..."
                  className={`w-full bg-transparent text-sm outline-none placeholder:opacity-50 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto px-1 pb-1">
              {filteredStates.length === 0 ? (
                <p
                  className={`text-sm text-center py-4 ${isDark ? "text-white/40" : "text-gray-400"}`}
                >
                  No states found
                </p>
              ) : (
                filteredStates.map((state) => {
                  const isSelected = userState === state.abbr;
                  return (
                    <button
                      key={state.abbr}
                      onClick={() => handleDropdownSelect(state.abbr)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                        isSelected
                          ? isDark
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-blue-50 text-blue-700"
                          : isDark
                            ? "text-white/80 hover:bg-white/10"
                            : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="font-mono text-xs w-6 opacity-60">
                        {state.abbr}
                      </span>
                      <span className="font-medium">{state.name}</span>
                      {isSelected && (
                        <MapPin size={14} className="ml-auto opacity-60" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
