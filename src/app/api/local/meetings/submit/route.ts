import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler, ValidationError, NotFoundError } from "@/lib/api-error-handler";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATE_REGEX = /^[A-Z]{2}$/;

/**
 * POST /api/local/meetings/submit
 * Accepts community-submitted meeting information for review.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { city, state, date, time, location, agenda, email } = body;

  if (!city || !state || !date || !location) {
    throw new ValidationError("City, state, date, and location are required");
  }

  const stateUpper = String(state).trim().toUpperCase();
  if (!STATE_REGEX.test(stateUpper)) {
    throw new ValidationError("State must be a 2-letter US state abbreviation");
  }

  const meetingDate = new Date(date);
  if (isNaN(meetingDate.getTime())) {
    throw new ValidationError("Invalid date format");
  }

  const trimmedEmail = email ? String(email).trim() : null;
  if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
    throw new ValidationError("Invalid email format");
  }

  const trimmedCity = String(city).trim();
  const trimmedLocation = String(location).trim();
  const trimmedAgenda = agenda ? String(agenda).trim() : null;

  if (trimmedCity.length > 100) {
    throw new ValidationError("City name must be 100 characters or less");
  }
  if (trimmedLocation.length > 200) {
    throw new ValidationError("Location must be 200 characters or less");
  }
  if (trimmedAgenda && trimmedAgenda.length > 5000) {
    throw new ValidationError("Agenda must be 5000 characters or less");
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
}, { route: "POST /api/local/meetings/submit" });
