-- AlterTable
ALTER TABLE "Hall" ADD COLUMN "rentalPriceWeekday" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Hall" ADD COLUMN "rentalPriceWeekend" INTEGER NOT NULL DEFAULT 0;
UPDATE "Hall" SET "rentalPriceWeekday" = "rentalPrice", "rentalPriceWeekend" = "rentalPrice";
ALTER TABLE "Hall" DROP COLUMN "rentalPrice";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN "hallRentalPriceWeekday" INTEGER;
ALTER TABLE "Application" ADD COLUMN "hallRentalPriceWeekend" INTEGER;
UPDATE "Application"
SET
  "hallRentalPriceWeekday" = "hallRentalPrice",
  "hallRentalPriceWeekend" = "hallRentalPrice"
WHERE "hallRentalPrice" IS NOT NULL;

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "adminComment" TEXT,
    "source" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_idempotencyKey_key" ON "Feedback"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");
