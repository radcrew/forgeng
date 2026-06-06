ALTER TABLE "payments" RENAME COLUMN "tx_hash" TO "tx_link";
ALTER TABLE "payments" ALTER COLUMN "tx_link" TYPE VARCHAR(500);
