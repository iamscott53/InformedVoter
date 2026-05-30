import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/local/meetings?municipalityId=...&upcoming=true
 * List meetings for a municipality.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const municipalityId = searchParams.get("municipalityId")?.trim();
    const upcoming = searchParams.get("upcoming") === "true";

    if (!municipalityId) {
      return NextResponse.json(
        { error: "municipalityId is required" },
        { status: 400 }
      );
    }

    const meetings = await prisma.localMeeting.findMany({
      where: {
        municipalityId,
        ...(upcoming
          ? {
              meetingDate: { gte: new Date() },
              status: "scheduled",
            }
          : {}),
      },
      include: {
        agendaItems: true,
      },
      orderBy: { meetingDate: "asc" },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("[local/meetings] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
