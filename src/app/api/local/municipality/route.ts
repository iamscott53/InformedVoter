import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/local/municipality?city=...&state=...&zip=...
 * Look up a municipality by city name, state, or zip code.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city")?.trim();
    const state = searchParams.get("state")?.trim().toUpperCase();
    const zip = searchParams.get("zip")?.trim();

    if (!city && !zip) {
      return NextResponse.json(
        { error: "Provide city or zip parameter" },
        { status: 400 }
      );
    }

    let municipality = null;

    if (zip) {
      // Search by zip code in the zipCodes array
      municipality = await prisma.municipality.findFirst({
        where: {
          zipCodes: { has: zip },
          ...(state ? { state } : {}),
        },
        include: {
          meetings: {
            where: {
              meetingDate: { gte: new Date() },
              status: "scheduled",
            },
            orderBy: { meetingDate: "asc" },
            take: 5,
          },
        },
      });
    }

    if (!municipality && city) {
      const whereClause: Record<string, unknown> = {
        name: { mode: "insensitive", equals: city },
      };
      if (state) whereClause.state = state;

      municipality = await prisma.municipality.findFirst({
        where: whereClause,
        include: {
          meetings: {
            where: {
              meetingDate: { gte: new Date() },
              status: "scheduled",
            },
            orderBy: { meetingDate: "asc" },
            take: 5,
          },
        },
      });

      // Fallback: partial match if exact fails
      if (!municipality) {
        municipality = await prisma.municipality.findFirst({
          where: {
            name: { mode: "insensitive", startsWith: city },
            ...(state ? { state } : {}),
          },
          include: {
            meetings: {
              where: {
                meetingDate: { gte: new Date() },
                status: "scheduled",
              },
              orderBy: { meetingDate: "asc" },
              take: 5,
            },
          },
        });
      }
    }

    return NextResponse.json({ municipality });
  } catch (error) {
    console.error("[local/municipality] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
