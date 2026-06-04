-- AlterEnum
-- Adds admin-facing notification types alongside the existing student ones.
ALTER TYPE "NotificationType" ADD VALUE 'submission_received';
ALTER TYPE "NotificationType" ADD VALUE 'application_received';
