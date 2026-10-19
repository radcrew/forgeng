-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('scheduled', 'cancelled');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'meeting_scheduled';
ALTER TYPE "NotificationType" ADD VALUE 'meeting_changed';
ALTER TYPE "NotificationType" ADD VALUE 'meeting_cancelled';

-- CreateTable
CREATE TABLE "google_calendar_connections" (
    "user_id" INTEGER NOT NULL,
    "google_email" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT NOT NULL,
    "connected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "broken_at" TIMESTAMPTZ,

    CONSTRAINT "google_calendar_connections_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" SERIAL NOT NULL,
    "host_id" INTEGER NOT NULL,
    "attendee_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "note" TEXT,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "google_event_id" TEXT,
    "meet_url" VARCHAR(500),
    "status" "MeetingStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meetings_host_id_starts_at_idx" ON "meetings"("host_id", "starts_at");

-- CreateIndex
CREATE INDEX "meetings_attendee_id_starts_at_idx" ON "meetings"("attendee_id", "starts_at");

-- AddForeignKey
ALTER TABLE "google_calendar_connections" ADD CONSTRAINT "google_calendar_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
