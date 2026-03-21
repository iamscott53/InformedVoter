"use client";

import { useState, useEffect, useCallback } from "react";

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
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${maxAge}`,
    "path=/",
    "SameSite=Lax",
  ].join("; ");
}

// ─────────────────────────────────────────────
// Geolocation → state abbr via a public reverse-geocode service
// We use the free ipapi.co service as a fallback (no key required)
// ─────────────────────────────────────────────

async function detectStateFromIP(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { region_code?: string; country_code?: string };
    if (data.country_code !== "US") return null;
    return data.region_code ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Hook return type
// ─────────────────────────────────────────────

export interface UseUserStateReturn {
  /** Two-letter state abbreviation, or null if not yet determined */
  userState: string | null;
  /** Update the user's state, persisting to cookie */
  setUserState: (abbr: string) => void;
  /** True while the initial detection is in progress */
  isLoading: boolean;
  /** True if the state was inferred by geolocation (not manually set) */
  isGeolocated: boolean;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useUserState(): UseUserStateReturn {
  const [userState, _setUserState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeolocated, setIsGeolocated] = useState(false);

  // On mount: read from cookie; if missing, attempt IP geolocation
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const fromCookie = readCookie(COOKIE_NAME);

      if (fromCookie) {
        if (!cancelled) {
          _setUserState(fromCookie.toUpperCase());
          setIsLoading(false);
        }
        return;
      }

      // No cookie — try IP-based geolocation
      const detected = await detectStateFromIP();
      if (!cancelled) {
        if (detected) {
          const abbr = detected.toUpperCase();
          writeCookie(COOKIE_NAME, abbr, COOKIE_MAX_AGE);
          _setUserState(abbr);
          setIsGeolocated(true);
        }
        setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const setUserState = useCallback((abbr: string) => {
    const normalized = abbr.toUpperCase();
    writeCookie(COOKIE_NAME, normalized, COOKIE_MAX_AGE);
    _setUserState(normalized);
    setIsGeolocated(false);
  }, []);

  return { userState, setUserState, isLoading, isGeolocated };
}
