// ─────────────────────────────────────────────
// GET /api/polling-places?address=<url-encoded address>
// Proxies the Google Civic Information API voterInfoQuery endpoint
// and returns normalised polling location data.
// ─────────────────────────────────────────────

interface CivicAddress {
  locationName?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface CivicPollingHours {
  open?: string;
  close?: string;
}

interface CivicLocation {
  address?: CivicAddress;
  pollingHours?: string;
  hours?: string;
  startDate?: string;
  endDate?: string;
  sources?: Array<{ name?: string; official?: boolean }>;
}

interface CivicVoterInfoResponse {
  kind?: string;
  election?: { name?: string; electionDay?: string };
  pollingLocations?: CivicLocation[];
  earlyVoteSites?: CivicLocation[];
  dropOffLocations?: CivicLocation[];
  error?: { code?: number; message?: string; status?: string };
}

function formatAddress(addr: CivicAddress | undefined): string | null {
  if (!addr) return null;
  const parts = [
    addr.locationName,
    addr.line1,
    addr.line2,
    addr.line3,
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.zip,
  ].filter(Boolean);
  return parts.join(", ") || null;
}

function normaliseLocation(loc: CivicLocation) {
  return {
    name: loc.address?.locationName ?? null,
    address: formatAddress(loc.address),
    pollingHours: loc.pollingHours ?? loc.hours ?? null,
    startDate: loc.startDate ?? null,
    endDate: loc.endDate ?? null,
    sources: loc.sources ?? [],
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address")?.trim();

    if (!address) {
      return Response.json(
        { error: "Query parameter 'address' is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
    if (!apiKey) {
      // Gracefully degrade — no key configured
      return Response.json(
        {
          pollingLocations: [],
          earlyVoteSites: [],
          dropOffLocations: [],
          election: null,
          notice: "Polling place lookup is not configured on this server.",
        },
        { status: 200 }
      );
    }

    const civicUrl = new URL(
      "https://www.googleapis.com/civicinfo/v2/voterinfo"
    );
    civicUrl.searchParams.set("key", apiKey);
    civicUrl.searchParams.set("address", address);
    civicUrl.searchParams.set("returnAllAvailableData", "true");

    const res = await fetch(civicUrl.toString(), {
      // Cache for 1 hour — polling places change rarely during an election cycle
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const errorMessage: string =
        errorBody?.error?.message ?? "Google Civic API request failed";

      // 404 from Google means no election data found for that address
      if (res.status === 404) {
        return Response.json(
          {
            pollingLocations: [],
            earlyVoteSites: [],
            dropOffLocations: [],
            election: null,
            notice:
              "No election data found for this address. Check back closer to an election date.",
          },
          { status: 200 }
        );
      }

      return Response.json({ error: errorMessage }, { status: res.status });
    }

    const data: CivicVoterInfoResponse = await res.json();

    return Response.json({
      election: data.election ?? null,
      pollingLocations: (data.pollingLocations ?? []).map(normaliseLocation),
      earlyVoteSites: (data.earlyVoteSites ?? []).map(normaliseLocation),
      dropOffLocations: (data.dropOffLocations ?? []).map(normaliseLocation),
    });
  } catch (error) {
    console.error("[polling-places] Unexpected error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
