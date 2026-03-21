// ─────────────────────────────────────────────
// IP Geolocation helpers
// ─────────────────────────────────────────────

interface IpApiResponse {
  status: "success" | "fail";
  regionName?: string; // full state name, e.g. "California"
  region?: string;     // state abbreviation, e.g. "CA"
  countryCode?: string;
  message?: string;
}

/**
 * Detect a US state name from an IP address using the free ip-api.com endpoint.
 * Returns the two-letter state abbreviation on success, or null on failure.
 */
export async function detectStateFromIP(ip: string): Promise<string | null> {
  // Skip loopback / private addresses — ip-api can't resolve them
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }

  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,countryCode,region,regionName`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) return null;

    const data: IpApiResponse = await res.json();

    if (data.status !== "success") return null;
    if (data.countryCode !== "US") return null;

    // Return the two-letter abbreviation when available, else the full region name
    return data.region ?? data.regionName ?? null;
  } catch {
    // Network error or JSON parse failure — fail gracefully
    return null;
  }
}

/**
 * Extract the client IP from common Next.js / edge request headers and then
 * resolve it to a US state abbreviation.
 *
 * Header precedence:
 *   1. x-forwarded-for  (CDN / proxy chains — first entry is the real client)
 *   2. x-real-ip        (common reverse-proxy header)
 *   3. cf-connecting-ip (Cloudflare)
 */
export async function getStateFromRequest(request: Request): Promise<string | null> {
  const headers = request.headers;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return detectStateFromIP(ip);
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return detectStateFromIP(realIp.trim());

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return detectStateFromIP(cfIp.trim());

  return null;
}
