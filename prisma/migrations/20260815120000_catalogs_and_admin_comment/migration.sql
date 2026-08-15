-- CreateTable
CREATE TABLE "HallFormat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HallFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalCinema" (
    "id" TEXT NOT NULL,
    "karoCinemaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "address" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalCinema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hall" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "rentalPrice" INTEGER NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hall_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Application" ADD COLUMN "adminComment" TEXT;
ALTER TABLE "Application" ADD COLUMN "hallFormatName" TEXT;
ALTER TABLE "Application" ADD COLUMN "hallCapacity" INTEGER;
ALTER TABLE "Application" ADD COLUMN "hallRentalPrice" INTEGER;
ALTER TABLE "Application" ADD COLUMN "watchCustom" TEXT;
ALTER TABLE "Application" ADD COLUMN "rentalStart" TEXT;
ALTER TABLE "Application" ADD COLUMN "rentalEnd" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "HallFormat_name_key" ON "HallFormat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RentalCinema_karoCinemaId_key" ON "RentalCinema"("karoCinemaId");

-- CreateIndex
CREATE INDEX "RentalCinema_cityId_enabled_idx" ON "RentalCinema"("cityId", "enabled");

-- CreateIndex
CREATE INDEX "Hall_cinemaId_formatId_idx" ON "Hall"("cinemaId", "formatId");

-- AddForeignKey
ALTER TABLE "Hall" ADD CONSTRAINT "Hall_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "RentalCinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hall" ADD CONSTRAINT "Hall_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "HallFormat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
