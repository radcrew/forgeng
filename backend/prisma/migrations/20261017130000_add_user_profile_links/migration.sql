-- AlterTable
-- Holds profile links for accounts that have no application yet.
ALTER TABLE "users" ADD COLUMN "profile_links" JSONB;
