"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Loader2, Search, ChevronDown } from "lucide-react";
import { useUserState } from "@/hooks/useUserState";

// ─────────────────────────────────────────────
// State metadata
// ─────────────────────────────────────────────

interface StateEntry {
  abbr: string;
  name: string;
}

const STATES: readonly StateEntry[] = [
  { abbr: "AL", name: "Alabama" },
  { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" },
  { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" },
  { abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" },
  { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" },
  { abbr: "IN", name: "Indiana" },
  { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" },
  { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" },
  { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" },
  { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" },
  { abbr: "MT", name: "Montana" },
  { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" },
  { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" },
  { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" },
  { abbr: "OH", name: "Ohio" },
  { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" },
  { abbr: "PA", name: "Pennsylvania" },
  { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" },
  { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" },
  { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" },
  { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" },
  { abbr: "WY", name: "Wyoming" },
  { abbr: "DC", name: "District of Columbia" },
] as const;

const STATE_BY_ABBR: Record<string, StateEntry> = Object.fromEntries(
  STATES.map((s) => [s.abbr, s])
);

// ─────────────────────────────────────────────
// SVG overlay paths — transparent clickable regions
// that sit on top of the map image. These are
// approximate regions for hit-testing; the image
// underneath provides the visual.
// ─────────────────────────────────────────────

const STATE_PATHS: Record<string, string> = {
  AL: "M722,419 L722,489 L718,509 L730,510 L738,519 L748,510 L751,489 L757,476 L760,449 L760,420 L722,419Z",
  AK: "M161,487 L183,487 L183,497 L189,497 L189,508 L195,508 L195,520 L161,520 L161,510 L149,510 L149,505 L140,505 L140,498 L131,498 L131,487 L128,487 L128,479 L138,479 L138,473 L150,473 L150,479 L159,479 L159,487 L161,487Z M100,530 L120,530 L120,545 L136,545 L136,558 L148,558 L148,573 L160,573 L160,587 L140,587 L140,578 L120,578 L120,568 L100,568 L100,553 L90,553 L90,540 L100,540 L100,530Z",
  AZ: "M186,385 L266,385 L275,495 L248,510 L231,510 L221,500 L186,500 L186,385Z",
  AR: "M611,404 L671,400 L675,470 L671,478 L611,478 L608,445 L611,404Z",
  CA: "M60,290 L128,175 L153,195 L170,255 L175,340 L172,375 L155,435 L142,455 L120,465 L100,455 L82,445 L68,425 L60,395 L56,360 L60,290Z",
  CO: "M293,282 L395,282 L395,370 L293,370 L293,282Z",
  CT: "M895,210 L920,200 L925,225 L900,230 L895,210Z",
  DE: "M870,300 L878,285 L885,300 L878,315 L870,300Z",
  FL: "M755,485 L790,475 L835,475 L858,490 L870,510 L865,555 L845,575 L818,585 L800,575 L785,540 L760,530 L748,510 L755,485Z M810,568 L825,555 L835,568 L825,580 L810,568Z",
  GA: "M760,420 L810,410 L825,460 L810,485 L790,475 L755,485 L760,449 L760,420Z",
  HI: "M280,555 L295,550 L310,555 L325,560 L340,565 L335,575 L315,575 L295,570 L280,565 L280,555Z",
  ID: "M188,90 L233,90 L238,120 L228,155 L240,195 L235,230 L215,250 L195,280 L180,280 L175,240 L178,190 L185,140 L188,90Z",
  IL: "M645,250 L680,248 L695,260 L700,290 L695,330 L685,360 L672,380 L650,385 L640,370 L642,330 L648,290 L645,250Z",
  IN: "M700,265 L738,258 L742,290 L738,335 L730,365 L700,368 L695,330 L700,290 L700,265Z",
  IA: "M555,225 L635,222 L640,250 L635,285 L555,288 L548,255 L555,225Z",
  KS: "M440,320 L558,318 L558,388 L440,390 L440,320Z",
  KY: "M700,345 L806,340 L810,350 L800,370 L790,380 L770,388 L740,388 L720,392 L695,385 L685,370 L695,355 L700,345Z",
  LA: "M620,475 L672,475 L690,490 L695,530 L680,545 L655,545 L635,535 L620,515 L612,498 L620,475Z",
  ME: "M908,75 L928,80 L938,115 L930,150 L915,155 L900,140 L895,115 L900,90 L908,75Z",
  MD: "M820,290 L870,285 L878,295 L885,310 L870,325 L845,330 L835,320 L825,310 L820,290Z",
  MA: "M895,195 L925,186 L938,192 L935,205 L920,210 L895,210 L895,195Z",
  MI: "M680,155 L700,150 L720,160 L740,180 L755,215 L760,245 L745,258 L730,250 L712,250 L700,240 L690,220 L680,195 L680,155Z M640,175 L665,165 L680,180 L675,210 L658,220 L640,215 L635,195 L640,175Z",
  MN: "M520,95 L605,95 L610,110 L625,130 L630,170 L635,222 L555,225 L548,190 L535,150 L520,120 L520,95Z",
  MS: "M690,420 L722,419 L722,489 L718,509 L695,530 L690,490 L672,475 L675,445 L690,420Z",
  MO: "M575,310 L645,305 L655,320 L660,350 L665,380 L650,400 L611,404 L595,395 L570,395 L560,375 L558,340 L575,310Z",
  MT: "M245,80 L400,78 L404,165 L380,170 L350,165 L310,170 L275,160 L248,155 L240,120 L245,80Z",
  NE: "M395,244 L535,240 L548,255 L555,288 L540,295 L475,300 L395,302 L395,244Z",
  NV: "M130,175 L188,175 L195,280 L180,340 L155,375 L130,345 L115,300 L130,175Z",
  NH: "M900,90 L915,85 L918,120 L915,155 L900,160 L895,140 L898,115 L900,90Z",
  NJ: "M870,235 L882,225 L890,245 L888,275 L878,290 L868,285 L865,260 L870,235Z",
  NM: "M266,385 L375,383 L380,490 L300,495 L275,495 L266,385Z",
  NY: "M830,165 L905,150 L915,165 L910,185 L895,195 L878,205 L865,215 L848,225 L840,220 L830,225 L825,210 L830,185 L830,165Z",
  NC: "M760,380 L870,370 L880,385 L870,410 L845,415 L810,410 L760,420 L755,400 L760,380Z",
  ND: "M405,78 L520,78 L520,95 L525,145 L520,165 L404,165 L405,78Z",
  OH: "M738,258 L780,248 L798,265 L798,305 L788,328 L770,340 L745,340 L730,335 L738,300 L738,258Z",
  OK: "M408,388 L440,390 L558,388 L560,410 L558,440 L535,445 L510,440 L490,435 L470,438 L448,440 L430,430 L408,420 L404,400 L408,388Z",
  OR: "M60,85 L180,80 L188,90 L185,140 L178,175 L130,175 L90,165 L60,145 L55,115 L60,85Z",
  PA: "M798,230 L870,220 L875,240 L870,265 L865,280 L820,290 L798,290 L790,272 L798,250 L798,230Z",
  RI: "M920,208 L930,205 L932,218 L924,222 L920,208Z",
  SC: "M790,400 L835,390 L850,410 L840,435 L820,445 L800,440 L790,425 L790,400Z",
  SD: "M395,165 L520,165 L525,185 L535,210 L535,240 L395,244 L395,165Z",
  TN: "M690,375 L808,368 L810,380 L808,400 L760,410 L695,415 L678,408 L672,395 L678,380 L690,375Z",
  TX: "M380,420 L408,420 L430,430 L448,440 L470,438 L490,435 L510,440 L535,445 L558,440 L568,458 L575,485 L570,520 L555,555 L530,575 L500,585 L465,580 L435,570 L415,555 L405,530 L395,510 L380,498 L375,460 L380,420Z",
  UT: "M195,280 L293,278 L293,370 L265,385 L230,385 L220,370 L195,350 L180,340 L195,280Z",
  VT: "M890,115 L900,90 L905,110 L905,150 L895,160 L886,155 L885,135 L890,115Z",
  VA: "M770,340 L845,330 L870,335 L878,345 L870,370 L820,385 L790,385 L760,380 L755,368 L760,355 L770,340Z",
  WA: "M80,28 L188,25 L192,72 L188,90 L120,92 L90,85 L65,70 L60,50 L80,28Z",
  WV: "M788,295 L810,290 L825,305 L838,325 L845,340 L830,345 L810,350 L800,345 L790,340 L778,340 L770,330 L775,310 L788,295Z",
  WI: "M600,120 L640,115 L660,130 L672,150 L680,175 L670,210 L650,225 L635,222 L610,210 L605,185 L610,150 L600,120Z",
  WY: "M258,155 L395,155 L395,244 L293,248 L275,240 L258,230 L250,195 L258,155Z",
  DC: "M847,320 L853,315 L856,322 L850,325 L847,320Z",
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface USStateMapProps {
  variant?: "light" | "dark";
  showDetectionBanner?: boolean;
}

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
  const detectedName = userState ? STATE_BY_ABBR[userState]?.name : null;
  const hoveredInfo = hoveredState ? STATE_BY_ABBR[hoveredState] : null;

  const filteredStates = search.trim()
    ? STATES.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.abbr.toLowerCase().includes(search.toLowerCase())
      )
    : STATES;

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

      {/* Interactive map: image with SVG overlay */}
      <div
        className="relative rounded-xl overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        <div
          className={`${isDark ? "bg-white/95" : "bg-white"} rounded-xl p-3 sm:p-4`}
        >
          {/* Base map image */}
          <div className="relative">
            <Image
              src="/images/united-states-of-america-map.jpg"
              alt="Map of the United States of America"
              width={960}
              height={620}
              className="w-full h-auto rounded-lg"
              priority
            />

            {/* SVG overlay — transparent clickable state regions */}
            <svg
              viewBox="0 0 960 620"
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Interactive map of the United States. Click a state to view its information."
            >
              {Object.entries(STATE_PATHS).map(([abbr, d]) => {
                const isSelected = userState === abbr;
                const isHovered = hoveredState === abbr;

                let fill = "transparent";
                let fillOpacity = 0;
                if (isSelected) {
                  fill = "#22C55E";
                  fillOpacity = 0.45;
                } else if (isHovered) {
                  fill = "#6B7280";
                  fillOpacity = 0.35;
                }

                return (
                  <path
                    key={abbr}
                    d={d}
                    fill={fill}
                    fillOpacity={fillOpacity}
                    stroke={isSelected ? "#16A34A" : isHovered ? "#4B5563" : "transparent"}
                    strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0}
                    className="cursor-pointer transition-all duration-150"
                    onClick={() => handleStateClick(abbr)}
                    onMouseEnter={() => setHoveredState(abbr)}
                    onMouseLeave={() => setHoveredState(null)}
                    role="button"
                    aria-label={STATE_BY_ABBR[abbr]?.name ?? abbr}
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
        </div>

        {/* Selected state badge */}
        {detectedName && !isLoading && (
          <div className="absolute top-5 right-5">
            <div className="bg-[#1B2A4A]/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg shadow-lg">
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-medium">
                Your State
              </p>
              <p className="text-sm font-bold">{detectedName}</p>
            </div>
          </div>
        )}
      </div>

      {/* State selector dropdown — fallback for small states / mobile */}
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
                ? `${STATE_BY_ABBR[userState]?.name ?? userState} — Click to change`
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
