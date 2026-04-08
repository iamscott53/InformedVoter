"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";
import { useUserState } from "@/hooks/useUserState";

// ─────────────────────────────────────────────
// State metadata: abbreviation, full name, label position
// ─────────────────────────────────────────────

interface StateInfo {
  abbr: string;
  name: string;
  labelX?: number;
  labelY?: number;
}

const STATE_INFO: Record<string, StateInfo> = {
  AL: { abbr: "AL", name: "Alabama", labelX: 743, labelY: 466 },
  AK: { abbr: "AK", name: "Alaska", labelX: 171, labelY: 573 },
  AZ: { abbr: "AZ", name: "Arizona", labelX: 224, labelY: 450 },
  AR: { abbr: "AR", name: "Arkansas", labelX: 640, labelY: 430 },
  CA: { abbr: "CA", name: "California", labelX: 108, labelY: 360 },
  CO: { abbr: "CO", name: "Colorado", labelX: 330, labelY: 320 },
  CT: { abbr: "CT", name: "Connecticut" },
  DE: { abbr: "DE", name: "Delaware" },
  FL: { abbr: "FL", name: "Florida", labelX: 810, labelY: 545 },
  GA: { abbr: "GA", name: "Georgia", labelX: 790, labelY: 460 },
  HI: { abbr: "HI", name: "Hawaii", labelX: 310, labelY: 575 },
  ID: { abbr: "ID", name: "Idaho", labelX: 205, labelY: 195 },
  IL: { abbr: "IL", name: "Illinois", labelX: 670, labelY: 330 },
  IN: { abbr: "IN", name: "Indiana", labelX: 710, labelY: 320 },
  IA: { abbr: "IA", name: "Iowa", labelX: 590, labelY: 265 },
  KS: { abbr: "KS", name: "Kansas", labelX: 490, labelY: 355 },
  KY: { abbr: "KY", name: "Kentucky", labelX: 750, labelY: 370 },
  LA: { abbr: "LA", name: "Louisiana", labelX: 650, labelY: 505 },
  ME: { abbr: "ME", name: "Maine", labelX: 920, labelY: 115 },
  MD: { abbr: "MD", name: "Maryland" },
  MA: { abbr: "MA", name: "Massachusetts" },
  MI: { abbr: "MI", name: "Michigan", labelX: 730, labelY: 230 },
  MN: { abbr: "MN", name: "Minnesota", labelX: 560, labelY: 165 },
  MS: { abbr: "MS", name: "Mississippi", labelX: 690, labelY: 470 },
  MO: { abbr: "MO", name: "Missouri", labelX: 620, labelY: 365 },
  MT: { abbr: "MT", name: "Montana", labelX: 310, labelY: 130 },
  NE: { abbr: "NE", name: "Nebraska", labelX: 460, labelY: 280 },
  NV: { abbr: "NV", name: "Nevada", labelX: 155, labelY: 310 },
  NH: { abbr: "NH", name: "New Hampshire" },
  NJ: { abbr: "NJ", name: "New Jersey" },
  NM: { abbr: "NM", name: "New Mexico", labelX: 305, labelY: 440 },
  NY: { abbr: "NY", name: "New York", labelX: 870, labelY: 195 },
  NC: { abbr: "NC", name: "North Carolina", labelX: 835, labelY: 400 },
  ND: { abbr: "ND", name: "North Dakota", labelX: 440, labelY: 140 },
  OH: { abbr: "OH", name: "Ohio", labelX: 760, labelY: 290 },
  OK: { abbr: "OK", name: "Oklahoma", labelX: 510, labelY: 410 },
  OR: { abbr: "OR", name: "Oregon", labelX: 130, labelY: 155 },
  PA: { abbr: "PA", name: "Pennsylvania", labelX: 840, labelY: 250 },
  RI: { abbr: "RI", name: "Rhode Island" },
  SC: { abbr: "SC", name: "South Carolina", labelX: 825, labelY: 435 },
  SD: { abbr: "SD", name: "South Dakota", labelX: 440, labelY: 200 },
  TN: { abbr: "TN", name: "Tennessee", labelX: 740, labelY: 400 },
  TX: { abbr: "TX", name: "Texas", labelX: 480, labelY: 490 },
  UT: { abbr: "UT", name: "Utah", labelX: 240, labelY: 310 },
  VT: { abbr: "VT", name: "Vermont" },
  VA: { abbr: "VA", name: "Virginia", labelX: 830, labelY: 350 },
  WA: { abbr: "WA", name: "Washington", labelX: 155, labelY: 90 },
  WV: { abbr: "WV", name: "West Virginia", labelX: 800, labelY: 330 },
  WI: { abbr: "WI", name: "Wisconsin", labelX: 630, labelY: 195 },
  WY: { abbr: "WY", name: "Wyoming", labelX: 320, labelY: 220 },
  DC: { abbr: "DC", name: "District of Columbia" },
};

// ─────────────────────────────────────────────
// SVG path data — Albers USA projection
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

// States large enough to show an abbreviation label
const LABELED_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "FL", "GA", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NM",
  "NY", "NC", "ND", "OH", "OK", "OR", "PA", "SC", "SD", "TN", "TX", "UT",
  "VA", "WA", "WI", "WV", "WY", "HI",
]);

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface USStateMapProps {
  /** Render on a dark background (hero placement) */
  variant?: "light" | "dark";
  /** Show the detection banner above the map */
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

  const isDark = variant === "dark";

  const handleClick = useCallback(
    (abbr: string) => {
      setUserState(abbr);
      router.push(`/state/${abbr.toLowerCase()}`);
    },
    [router, setUserState]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const hoveredInfo = hoveredState ? STATE_INFO[hoveredState] : null;
  const detectedName = userState ? STATE_INFO[userState]?.name : null;

  // ── Colors based on variant ──
  const colorDefault = isDark ? "rgba(255,255,255,0.12)" : "#E5E7EB";
  const colorHover = isDark ? "rgba(96,165,250,0.6)" : "#6B92C7";
  const colorSelected = isDark ? "#60A5FA" : "#1B2A4A";
  const colorStroke = isDark ? "rgba(255,255,255,0.2)" : "#FFFFFF";
  const colorLabel = isDark ? "rgba(255,255,255,0.7)" : "#374151";
  const colorLabelSelected = isDark ? "#1E293B" : "#FFFFFF";

  return (
    <div className="relative w-full" onMouseMove={handleMouseMove}>
      {/* ── Detection banner ── */}
      {showDetectionBanner && (
        <div className="mb-4 text-center">
          {isLoading ? (
            <div className="inline-flex items-center gap-2 text-white/60">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm font-medium">Detecting your state...</span>
            </div>
          ) : detectedName ? (
            <div className="inline-flex items-center gap-2">
              <MapPin size={16} className={isDark ? "text-blue-400" : "text-[#1B2A4A]"} />
              <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#1B2A4A]"}`}>
                We detected you&apos;re in{" "}
                <span className={isDark ? "text-blue-300" : "text-blue-600"}>
                  {detectedName}
                </span>
              </span>
              <span className={isDark ? "text-white/30" : "text-gray-300"}>|</span>
              <span className={`text-xs ${isDark ? "text-white/50" : "text-gray-400"}`}>
                Click any state to change
              </span>
            </div>
          ) : (
            <p className={`text-sm font-medium ${isDark ? "text-white/60" : "text-gray-500"}`}>
              Click any state to explore its civic information
            </p>
          )}
        </div>
      )}

      {/* ── Tooltip ── */}
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

      {/* ── SVG Map ── */}
      <svg
        viewBox="0 0 960 620"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Interactive map of the United States. Click a state to view its information."
      >
        {/* Glow filter for the selected state */}
        <defs>
          <filter id="state-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render state paths */}
        {Object.entries(STATE_PATHS).map(([abbr, d]) => {
          const isSelected = userState === abbr;
          const isHovered = hoveredState === abbr;

          let fill = colorDefault;
          if (isSelected) fill = colorSelected;
          else if (isHovered) fill = colorHover;

          return (
            <path
              key={abbr}
              id={abbr}
              data-state={abbr}
              d={d}
              fill={fill}
              stroke={colorStroke}
              strokeWidth={isSelected ? 2.5 : 1.5}
              filter={isSelected ? "url(#state-glow)" : undefined}
              className="cursor-pointer transition-colors duration-150"
              onClick={() => handleClick(abbr)}
              onMouseEnter={() => setHoveredState(abbr)}
              onMouseLeave={() => setHoveredState(null)}
              role="button"
              aria-label={STATE_INFO[abbr]?.name ?? abbr}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(abbr);
                }
              }}
            />
          );
        })}

        {/* State abbreviation labels */}
        {Object.entries(STATE_INFO)
          .filter(
            ([abbr, info]) =>
              LABELED_STATES.has(abbr) && info.labelX && info.labelY
          )
          .map(([abbr, info]) => {
            const isSelected = userState === abbr;
            return (
              <text
                key={`label-${abbr}`}
                x={info.labelX}
                y={info.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none"
                fill={isSelected ? colorLabelSelected : colorLabel}
                fontSize={isSelected ? 13 : 11}
                fontWeight={isSelected ? 700 : 600}
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {abbr}
              </text>
            );
          })}
      </svg>
    </div>
  );
}
