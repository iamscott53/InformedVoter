"use client";

import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import { useUserState } from "@/hooks/useUserState";

interface State {
  abbr: string;
  name: string;
}

interface StateDetectorProps {
  states: State[];
}

export default function StateDetector({ states }: StateDetectorProps) {
  const router = useRouter();
  const { userState, isLoading } = useUserState();

  const stateName = states.find((s) => s.abbr === userState)?.name ?? userState;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const abbr = e.target.value;
    if (abbr) {
      router.push(`/state/${abbr}`);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      {/* Detected state */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin size={16} className="text-[#1B2A4A] shrink-0" />
        {isLoading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 size={14} className="animate-spin text-[#1B2A4A]" />
            Detecting your state…
          </span>
        ) : userState ? (
          <span>
            It looks like you&apos;re in{" "}
            <a
              href={`/state/${userState}`}
              className="font-semibold text-[#1B2A4A] hover:underline"
            >
              {stateName}
            </a>
          </span>
        ) : (
          <span>Select your state to get started</span>
        )}
      </div>

      {/* Divider */}
      <span className="hidden sm:block text-gray-300 select-none">·</span>

      {/* Manual selector */}
      <div className="relative inline-flex items-center">
        <select
          value=""
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
