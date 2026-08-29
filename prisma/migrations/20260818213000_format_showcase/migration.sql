-- AlterTable
ALTER TABLE "HallFormat" ADD COLUMN "showcasePublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "HallFormat" ADD COLUMN "showcaseOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "HallFormat_showcasePublished_showcaseOrder_idx" ON "HallFormat"("showcasePublished", "showcaseOrder");

-- Copy published hall photos onto their formats
UPDATE "HallFormat" AS f
SET
  "imageUrl" = COALESCE(f."imageUrl", h."imageUrl"),
  "showcasePublished" = CASE WHEN h."showcasePublished" THEN true ELSE f."showcasePublished" END,
  "showcaseOrder" = CASE WHEN h."showcasePublished" THEN h."showcaseOrder" ELSE f."showcaseOrder" END
FROM (
  SELECT DISTINCT ON ("formatId") *
  FROM "Hall"
  WHERE "showcasePublished" = true AND "imageUrl" IS NOT NULL
  ORDER BY "formatId", "showcaseOrder" ASC, "name" ASC
) AS h
WHERE h."formatId" = f.id;

-- AlterTable
DROP INDEX IF EXISTS "Hall_showcasePublished_showcaseOrder_idx";
ALTER TABLE "Hall" DROP COLUMN "imageUrl";
ALTER TABLE "Hall" DROP COLUMN "showcasePublished";
ALTER TABLE "Hall" DROP COLUMN "showcaseOrder";
