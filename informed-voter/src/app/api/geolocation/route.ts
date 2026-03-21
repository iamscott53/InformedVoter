import { getStateFromRequest, detectStateFromIP } from "@/lib/geolocation";

// ─────────────────────────────────────────────
// GET /api/geolocation
// Detect the visitor's US state from their IP address.
// Returns { state: "CA", stateName: "California" } or { state: null }
// ─────────────────────────────────────────────

interface IpApiFullResponse {
  status: "success" | "fail";
  regionName?: string;
  region?: string;
  countryCode?: string;
  message?: string;
}

/**
 * Resolve an IP address to a US state abbreviation AND full state name.
 * Returns both values so callers don't need a second lookup.
 */
async function detectStateInfoFromIP(
  ip: string
): Promise<{ state: string; stateName: string } | null> {
  if (
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  ) {
    return null;
  }

  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,countryCode,region,regionName`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) return null;

    const data: IpApiFullResponse = await res.json();

    if (data.status !== "success") return null;
    if (data.countryCode !== "US") return null;
    if (!data.region || !data.regionName) return null;

    return { state: data.region, stateName: data.regionName };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const headers = request.headers;

    // Resolve client IP with the same precedence as lib/geolocation
    let ip: string | null = null;

    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      ip = forwarded.split(",")[0].trim();
    } else {
      ip =
        headers.get("x-real-ip")?.trim() ??
        headers.get("cf-connecting-ip")?.trim() ??
        null;
    }

    if (!ip) {
      return Response.json({ state: null });
    }

    const result = await detectStateInfoFromIP(ip);

    if (!result) {
      return Response.json({ state: null });
    }

    return Response.json({ state: result.state, stateName: result.stateName });
  } catch (error) {
    console.error("[geolocation] Unexpected error:", error);
    return Response.json(
      { error: "Internal server error", state: null },
      { status: 500 }
    );
  }
}
