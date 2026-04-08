"use client";

import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const COOKIE_NAME = "user-state";
/** Tracks whether the state was set manually or auto-detected */
const COOKIE_SOURCE = "user-state-source";
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
// Geolocation → state abbr
// Primary: browser geolocation (GPS/WiFi) + reverse geocode
// Fallback: IP-based geolocation via ipapi.co
// ─────────────────────────────────────────────

/** Use the browser Geolocation API + reverse geocode to detect the US state. */
async function detectStateFromBrowser(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  try {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 600_000, // cache position for 10 min
        });
      }
    );

    const { latitude, longitude } = position.coords;

    // Reverse geocode via BigDataCloud (free, no API key required)
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      principalSubdivisionCode?: string;
      countryCode?: string;
    };
    if (data.countryCode !== "US") return null;

    // principalSubdivisionCode is like "US-CA"
    const code = data.principalSubdivisionCode;
    if (!code || !code.startsWith("US-")) return null;
    return code.slice(3); // → "CA"
  } catch {
    // User denied permission or timeout — fall through to IP fallback
    return null;
  }
}

/** Fallback: detect state from IP address via ipapi.co (no key required). */
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
  // Read cookies synchronously on first render to avoid flash of wrong state
  const initialState = typeof document !== "undefined" ? readCookie(COOKIE_NAME)?.toUpperCase() ?? null : null;
  const initialSource = typeof document !== "undefined" ? readCookie(COOKIE_SOURCE) : null;
  const isManual = initialSource === "manual";

  // Show cached state immediately (avoids flash), but re-detect if it was auto-detected
  const [userState, _setUserState] = useState<string | null>(initialState);
  const [isLoading, setIsLoading] = useState(!isManual && initialState === null);
  const [isGeolocated, setIsGeolocated] = useState(false);

  // On mount: detect state unless user manually chose one
  useEffect(() => {
    // If user manually selected their state, trust it
    if (isManual) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      // Try accurate browser geolocation first, then fall back to IP
      const detected =
        (await detectStateFromBrowser()) ?? (await detectStateFromIP());
      if (!cancelled) {
        if (detected) {
          const abbr = detected.toUpperCase();
          writeCookie(COOKIE_NAME, abbr, COOKIE_MAX_AGE);
          writeCookie(COOKIE_SOURCE, "auto", COOKIE_MAX_AGE);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setUserState = useCallback((abbr: string) => {
    const normalized = abbr.toUpperCase();
    writeCookie(COOKIE_NAME, normalized, COOKIE_MAX_AGE);
    writeCookie(COOKIE_SOURCE, "manual", COOKIE_MAX_AGE);
    _setUserState(normalized);
    setIsGeolocated(false);
  }, []);

  return { userState, setUserState, isLoading, isGeolocated };
}
