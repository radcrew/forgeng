-- Replace three separate wallet columns with a single JSONB array.
ALTER TABLE "applications" DROP COLUMN IF EXISTS "wallet_evm";
ALTER TABLE "applications" DROP COLUMN IF EXISTS "wallet_solana";
ALTER TABLE "applications" DROP COLUMN IF EXISTS "wallet_tron";
ALTER TABLE "applications" ADD COLUMN "wallets" JSONB;
