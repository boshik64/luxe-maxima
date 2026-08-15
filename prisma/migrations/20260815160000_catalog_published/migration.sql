-- AlterTable
ALTER TABLE "HallFormat" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Hall" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
