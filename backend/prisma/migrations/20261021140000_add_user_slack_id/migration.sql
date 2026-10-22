-- AlterTable
ALTER TABLE "users" ADD COLUMN     "slack_user_id" VARCHAR(32);

-- CreateIndex
CREATE UNIQUE INDEX "users_slack_user_id_key" ON "users"("slack_user_id");
