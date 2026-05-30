import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  fetchLegistarEvents,
  fetchLegistarEventItems,
  mapLegistarEventToMeeting,
  mapLegistarMatterToAgendaItem,
} from "@/lib/local/legistar-client";

/**
 * Cron: sync-local-meetings
 * Fetches upcoming meetings from Legistar for all municipalities
 * that have a legistarClient configured.
 *
 * Authorization: Bearer CRON_SECRET (same as other cron routes)
 */
export async function GET(request: NextRequest) {
  // ── Auth ──
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  const manual = request.nextUrl.searchParams.get("manual") === "true";

  if (process.env.ALLOW_MANUAL_CRON === "true" && manual) {
    // allow through
  } else if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  let recordsSynced = 0;
  let recordsFailed = 0;
  const errors: string[] = [];

  try {
    // Find all municipalities with Legistar configured
    const municipalities = await prisma.municipality.findMany({
      where: { legistarClient: { not: null } },
    });

    const today = new Date().toISOString().split("T")[0];
    const ninetyDaysLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    for (const muni of municipalities) {
      if (!muni.legistarClient) continue;

      try {
        const events = await fetchLegistarEvents(muni.legistarClient, {
          fromDate: today,
          toDate: ninetyDaysLater,
        });

        for (const event of events) {
          try {
            const meetingData = mapLegistarEventToMeeting(event, muni.id);

            // Upsert meeting by source URL + date to avoid duplicates
            const existing = await prisma.localMeeting.findFirst({
              where: {
                municipalityId: muni.id,
                meetingDate: meetingData.meetingDate,
                sourceUrl: meetingData.sourceUrl || undefined,
              },
            });

            let meetingId: string;

            if (existing) {
              await prisma.localMeeting.update({
                where: { id: existing.id },
                data: {
                  ...meetingData,
                  sourceUrl: meetingData.sourceUrl || existing.sourceUrl,
                },
              });
              meetingId = existing.id;
            } else {
              const created = await prisma.localMeeting.create({
                data: meetingData,
              });
              meetingId = created.id;
              recordsSynced++;
            }

            // Sync agenda items
            try {
              const matters = await fetchLegistarEventItems(
                muni.legistarClient,
                event.EventId
              );

              // Clear old agenda items and re-insert (simple strategy)
              await prisma.meetingAgendaItem.deleteMany({
                where: { meetingId },
              });

              if (matters.length > 0) {
                await prisma.meetingAgendaItem.createMany({
                  data: matters.map((m) => ({
                    meetingId,
                    ...mapLegistarMatterToAgendaItem(m),
                  })),
                });
              }
            } catch (itemErr) {
              // Non-fatal: agenda items may not always be available
              console.warn(
                `[sync-local-meetings] Failed to sync agenda items for event ${event.EventId}:`
              );
            }
          } catch (eventErr) {
            recordsFailed++;
            const msg =
              eventErr instanceof Error ? eventErr.message : String(eventErr);
            errors.push(`${muni.name}: ${msg}`);
          }
        }
      } catch (muniErr) {
        const msg =
          muniErr instanceof Error ? muniErr.message : String(muniErr);
        errors.push(`${muni.name}: ${msg}`);
      }
    }

    // Log sync result
    await prisma.dataSyncLog.create({
      data: {
        syncType: "local-meetings",
        status: errors.length > 0 ? (recordsSynced > 0 ? "partial" : "failed") : "success",
        recordsTotal: recordsSynced + recordsFailed,
        recordsSynced,
        recordsFailed,
        durationMs: Date.now() - startTime,
        errorMessage: errors.length > 0 ? errors.join("; ").slice(0, 2000) : null,
        metadata: { source: "legistar" },
      },
    });

    return NextResponse.json({
      success: true,
      recordsSynced,
      recordsFailed,
      errors: errors.length > 0 ? errors : undefined,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[sync-local-meetings] fatal error:", msg);

    await prisma.dataSyncLog.create({
      data: {
        syncType: "local-meetings",
        status: "failed",
        recordsTotal: 0,
        recordsSynced: 0,
        recordsFailed: 0,
        durationMs: Date.now() - startTime,
        errorMessage: msg.slice(0, 2000),
      },
    });

    return NextResponse.json(
      { error: "Sync failed", details: msg },
      { status: 500 }
    );
  }
}
