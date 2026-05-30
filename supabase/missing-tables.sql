-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Add Local Government tables
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- CreateTable Municipality
CREATE TABLE IF NOT EXISTS "Municipality" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCodes" TEXT[],
    "county" TEXT,
    "cityHallAddress" TEXT,
    "cityHallLat" DOUBLE PRECISION,
    "cityHallLng" DOUBLE PRECISION,
    "councilMeetingAddress" TEXT,
    "councilMeetingLat" DOUBLE PRECISION,
    "councilMeetingLng" DOUBLE PRECISION,
    "meetingScheduleNote" TEXT,
    "legistarClient" TEXT,
    "civicPlusUrl" TEXT,
    "dataSource" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable LocalMeeting
CREATE TABLE IF NOT EXISTS "LocalMeeting" (
    "id" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "agendaUrl" TEXT,
    "agendaText" TEXT,
    "restrictions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "sourceUrl" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable MeetingAgendaItem
CREATE TABLE IF NOT EXISTS "MeetingAgendaItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "itemNumber" TEXT,
    "templatePrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable SubmittedMeeting
CREATE TABLE IF NOT EXISTS "SubmittedMeeting" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "location" TEXT NOT NULL,
    "agenda" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmittedMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Municipality_state_idx" ON "Municipality"("state");
CREATE INDEX IF NOT EXISTS "Municipality_name_idx" ON "Municipality"("name");
CREATE INDEX IF NOT EXISTS "LocalMeeting_municipalityId_idx" ON "LocalMeeting"("municipalityId");
CREATE INDEX IF NOT EXISTS "LocalMeeting_meetingDate_idx" ON "LocalMeeting"("meetingDate");
CREATE INDEX IF NOT EXISTS "LocalMeeting_status_idx" ON "LocalMeeting"("status");
CREATE INDEX IF NOT EXISTS "MeetingAgendaItem_meetingId_idx" ON "MeetingAgendaItem"("meetingId");
CREATE INDEX IF NOT EXISTS "SubmittedMeeting_status_idx" ON "SubmittedMeeting"("status");
CREATE INDEX IF NOT EXISTS "SubmittedMeeting_createdAt_idx" ON "SubmittedMeeting"("createdAt");

-- AddForeignKey
ALTER TABLE "LocalMeeting" DROP CONSTRAINT IF EXISTS "LocalMeeting_municipalityId_fkey";
ALTER TABLE "LocalMeeting" ADD CONSTRAINT "LocalMeeting_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MeetingAgendaItem" DROP CONSTRAINT IF EXISTS "MeetingAgendaItem_meetingId_fkey";
ALTER TABLE "MeetingAgendaItem" ADD CONSTRAINT "MeetingAgendaItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "LocalMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
