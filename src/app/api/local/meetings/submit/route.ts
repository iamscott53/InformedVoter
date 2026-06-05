import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATE_REGEX = /^[A-Z]{2}$/;

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

    const stateUpper = String(state).trim().toUpperCase();
    if (!STATE_REGEX.test(stateUpper)) {
      return NextResponse.json(
        { error: "State must be a 2-letter US state abbreviation" },
        { status: 400 }
      );
    }

    const meetingDate = new Date(date);
    if (isNaN(meetingDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const trimmedEmail = email ? String(email).trim() : null;
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const trimmedCity = String(city).trim();
    const trimmedLocation = String(location).trim();
    const trimmedAgenda = agenda ? String(agenda).trim() : null;

    if (trimmedCity.length > 100) {
      return NextResponse.json(
        { error: "City name must be 100 characters or less" },
        { status: 400 }
      );
    }
    if (trimmedLocation.length > 200) {
      return NextResponse.json(
        { error: "Location must be 200 characters or less" },
        { status: 400 }
      );
    }
    if (trimmedAgenda && trimmedAgenda.length > 5000) {
      return NextResponse.json(
        { error: "Agenda must be 5000 characters or less" },
        { status: 400 }
      );
    }

    const submitted = await prisma.submittedMeeting.create({
      data: {
        city: trimmedCity,
        state: stateUpper,
        meetingDate,
        startTime: time ? String(time).trim() : null,
        location: trimmedLocation,
        agenda: trimmedAgenda,
        email: trimmedEmail,
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
