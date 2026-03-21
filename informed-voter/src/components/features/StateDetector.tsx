"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";

interface State {
  abbr: string;
  name: string;
}

interface StateDetectorProps {
  states: State[];
}

// Simple IP-based state detection fallback — defaults to CA
function useDetectedState() {
  const [detectedState, setDetectedState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production this would call a geo API; for now we use a mock
    const timer = setTimeout(() => {
      setDetectedState({ abbr: "CA", name: "California" });
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return { detectedState, loading };
}

export default function StateDetector({ states }: StateDetectorProps) {
  const router = useRouter();
  const { detectedState, loading } = useDetectedState();
  const [selectedAbbr, setSelectedAbbr] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const abbr = e.target.value;
    setSelectedAbbr(abbr);
    if (abbr) {
      router.push(`/state/${abbr}`);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Detected state */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin size={16} className="text-[#1B2A4A] shrink-0" />
        {loading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 size={14} className="animate-spin text-[#1B2A4A]" />
            Detecting your state…
          </span>
        ) : (
          <span>
            It looks like you&apos;re in{" "}
            <a
              href={`/state/${detectedState?.abbr}`}
              className="font-semibold text-[#1B2A4A] hover:underline"
            >
              {detectedState?.name}
            </a>
          </span>
        )}
      </div>

      {/* Divider */}
      <span className="hidden sm:block text-gray-300 select-none">·</span>

      {/* Manual selector */}
      <div className="relative inline-flex items-center">
        <select
          value={selectedAbbr}
          onChange={handleChange}
          aria-label="Change state"
          className="appearance-none pl-3 pr-8 py-2 text-sm font-medium text-[#1B2A4A] bg-white border border-gray-300 rounded-lg hover:border-[#1B2A4A]/50 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30 cursor-pointer shadow-sm"
        >
          <option value="">Change State…</option>
          {states.map((s) => (
            <option key={s.abbr} value={s.abbr}>
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 text-gray-500"
        />
      </div>
    </div>
  );
}
