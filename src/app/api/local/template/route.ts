import { NextRequest, NextResponse } from "next/server";
import { generateSpeakingTemplate } from "@/lib/ai/claude-client";

/**
 * POST /api/local/template
 * Body: { agendaItemTitle, agendaItemDescription, tone: "professional" | "assertive" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agendaItemTitle, agendaItemDescription, tone } = body;

    if (!agendaItemTitle || !tone) {
      return NextResponse.json(
        { error: "agendaItemTitle and tone are required" },
        { status: 400 }
      );
    }

    const template = await generateSpeakingTemplate({
      agendaItemTitle,
      agendaItemDescription: agendaItemDescription || "",
      tone,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[local/template] error:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
