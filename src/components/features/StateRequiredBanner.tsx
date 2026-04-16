"use client";

import { MapPin } from "lucide-react";
import { useUserState } from "@/hooks/useUserState";

export default function StateRequiredBanner() {
  const { userState, isLoading } = useUserState();

  // Don't show if state is already selected or still loading
  if (isLoading || userState) return null;

  return (
    <div
      className="bg-amber-50 border-b border-amber-200"
      role="alert"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2 text-sm">
        <MapPin size={15} className="text-amber-600 flex-shrink-0" />
        <p className="text-amber-800 font-medium">
          Location could not be verified.{" "}
          <a
            href="/#select-state"
            className="underline underline-offset-2 hover:text-amber-900"
          >
            Please select your state
          </a>{" "}
          or the state you wish to research.
        </p>
      </div>
    </div>
  );
}
