"use client";

import { useState, useCallback } from "react";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const COOKIE_NAME = "user-state";
/** Cookie max-age in seconds — 1 year */
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

// ─────────────────────────────────────────────
// Cookie helpers (browser-safe)
// ─────────────────────────────────────────────

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined") return;
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${maxAge}`,
    "path=/",
    "SameSite=Lax",
    ...(isHttps ? ["Secure"] : []),
  ].join("; ");
}

// ─────────────────────────────────────────────
// Hook return type
// ─────────────────────────────────────────────

export interface UseUserStateReturn {
  /** Two-letter state abbreviation, or null if not yet selected */
  userState: string | null;
  /** Update the user's state, persisting to cookie */
  setUserState: (abbr: string) => void;
  /** Always false — no auto-detection */
  isLoading: boolean;
  /** Always false — no auto-detection */
  isGeolocated: boolean;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useUserState(): UseUserStateReturn {
  const initialState =
    typeof document !== "undefined"
      ? readCookie(COOKIE_NAME)?.toUpperCase() ?? null
      : null;

  const [userState, _setUserState] = useState<string | null>(initialState);

  const setUserState = useCallback((abbr: string) => {
    const normalized = abbr.toUpperCase();
    writeCookie(COOKIE_NAME, normalized, COOKIE_MAX_AGE);
    _setUserState(normalized);
  }, []);

  return { userState, setUserState, isLoading: false, isGeolocated: false };
}
