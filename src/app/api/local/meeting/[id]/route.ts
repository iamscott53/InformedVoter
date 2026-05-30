import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/local/meeting/:id
 * Get a single meeting with agenda items and municipality info.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const meeting = await prisma.localMeeting.findUnique({
      where: { id },
      include: {
        municipality: true,
        agendaItems: {
          orderBy: { itemNumber: "asc" },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("[local/meeting/:id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
