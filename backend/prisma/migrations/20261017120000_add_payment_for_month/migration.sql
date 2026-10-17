-- AlterTable
ALTER TABLE "payments" ADD COLUMN "for_month" VARCHAR(7);

-- Older payments didn't record their stipend month, so use the month they
-- were paid.
UPDATE "payments" SET "for_month" = to_char("paid_at" AT TIME ZONE 'UTC', 'YYYY-MM');

ALTER TABLE "payments" ALTER COLUMN "for_month" SET NOT NULL;
