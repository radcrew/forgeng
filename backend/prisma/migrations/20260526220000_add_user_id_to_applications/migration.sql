-- AlterTable: add the user_id FK that was missing from the init migration
ALTER TABLE "applications" ADD COLUMN "user_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_key" ON "applications"("user_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
