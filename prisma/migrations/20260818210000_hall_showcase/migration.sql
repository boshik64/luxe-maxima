-- AlterTable
ALTER TABLE "Hall" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Hall" ADD COLUMN "showcasePublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Hall" ADD COLUMN "showcaseOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Hall_showcasePublished_showcaseOrder_idx" ON "Hall"("showcasePublished", "showcaseOrder");
