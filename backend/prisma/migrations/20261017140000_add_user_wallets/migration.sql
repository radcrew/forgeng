-- AlterTable
-- Holds stipend wallets for accounts that have no application yet.
ALTER TABLE "users" ADD COLUMN "wallets" JSONB;
