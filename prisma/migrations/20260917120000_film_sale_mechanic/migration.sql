-- CreateTable
CREATE TABLE "FilmSaleMechanic" (
    "saleId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilmSaleMechanic_pkey" PRIMARY KEY ("saleId")
);
