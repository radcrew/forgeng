-- CreateTable
CREATE TABLE "platform_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "stipend_month_1" DECIMAL(12,2) NOT NULL DEFAULT 30,
    "stipend_month_2" DECIMAL(12,2) NOT NULL DEFAULT 50,
    "stipend_month_3" DECIMAL(12,2) NOT NULL DEFAULT 100,
    "stipend_currency" VARCHAR(20) NOT NULL DEFAULT 'USDT',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- Seed the default singleton row
INSERT INTO "platform_settings" ("id") VALUES (1);
