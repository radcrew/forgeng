-- CreateTable
CREATE TABLE "notification_preferences" (
    "user_id" INTEGER NOT NULL,
    "feedback_in_app" BOOLEAN NOT NULL DEFAULT true,
    "feedback_email" BOOLEAN NOT NULL DEFAULT true,
    "task_in_app" BOOLEAN NOT NULL DEFAULT true,
    "task_email" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
