-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "last_submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Earlier resubmits were not recorded, so existing work counts from its
-- first send.
UPDATE "submissions" SET "last_submitted_at" = "created_at";
