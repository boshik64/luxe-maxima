-- CreateTable
CREATE TABLE "SiteBanner" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "href" TEXT,
    "alt" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteBanner_slot_key" ON "SiteBanner"("slot");
