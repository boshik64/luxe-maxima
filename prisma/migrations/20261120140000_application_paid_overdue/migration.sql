-- AlterTable
ALTER TABLE "Application" ADD COLUMN "paid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Application" ADD COLUMN "autoRejectedOverdue" BOOLEAN NOT NULL DEFAULT false;
