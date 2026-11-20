-- AlterTable
ALTER TABLE "Application" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Application" ADD COLUMN "statusEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: считаем вход в статус с последнего обновления
UPDATE "Application" SET "statusEnteredAt" = "updatedAt";

-- CreateIndex
CREATE INDEX "Application_archived_status_statusEnteredAt_idx" ON "Application"("archived", "status", "statusEnteredAt");
