-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "published_at" TIMESTAMPTZ;

-- Tasks that are published now were already announced to students, so
-- publishing them again later must not notify anyone.
UPDATE "tasks" SET "published_at" = "updated_at" WHERE "status" = 'published';
