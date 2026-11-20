-- AlterTable
ALTER TABLE "Application" ADD COLUMN "wantRepertoireFilm" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Application" ADD COLUMN "wantCustomContent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Application" ADD COLUMN "contactLastName" TEXT NOT NULL DEFAULT '';
