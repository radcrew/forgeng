-- Migrate mentor users to admin and drop mentor from Role enum.
UPDATE "users" SET "role" = 'admin' WHERE "role" = 'mentor';

ALTER TABLE "feedback" RENAME COLUMN "mentor_id" TO "reviewer_id";
ALTER TABLE "feedback" RENAME CONSTRAINT "feedback_mentor_id_fkey" TO "feedback_reviewer_id_fkey";

ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('applicant', 'student', 'admin');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'applicant';
DROP TYPE "Role_old";
