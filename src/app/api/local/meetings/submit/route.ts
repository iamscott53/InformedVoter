import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/local/meetings/submit
 * Accepts community-submitted meeting information for review.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, state, date, time, location, agenda, email } = body;

    if (!city || !state || !date || !location) {
      return NextResponse.json(
        { error: "City, state, date, and location are required" },
        { status: 400 }
      );
    }

    const submitted = await prisma.submittedMeeting.create({
      data: {
        city: city.trim(),
        state: state.trim().toUpperCase(),
        meetingDate: new Date(date),
        startTime: time || null,
        location: location.trim(),
        agenda: agenda?.trim() || null,
        email: email?.trim() || null,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, submitted });
  } catch (error) {
    console.error("[local/meetings/submit] error:", error);
    return NextResponse.json(
      { error: "Failed to submit meeting" },
      { status: 500 }
    );
  }
}
