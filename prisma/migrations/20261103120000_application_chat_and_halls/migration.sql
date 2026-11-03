-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'WAITING_REPLY';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'ANSWERED';

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailSignature" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Hall" ADD COLUMN "priceOnRequest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Hall" ADD COLUMN "consoleGaming" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
CREATE SEQUENCE "Application_publicNumber_seq";
ALTER TABLE "Application" ADD COLUMN "publicNumber" INTEGER NOT NULL DEFAULT nextval('"Application_publicNumber_seq"');
ALTER TABLE "Application" ADD COLUMN "managerId" TEXT;
ALTER SEQUENCE "Application_publicNumber_seq" OWNED BY "Application"."publicNumber";

UPDATE "Application" SET "publicNumber" = nextval('"Application_publicNumber_seq"') WHERE "publicNumber" IS NULL;

CREATE UNIQUE INDEX "Application_publicNumber_key" ON "Application"("publicNumber");
CREATE INDEX "Application_managerId_createdAt_idx" ON "Application"("managerId", "createdAt");

ALTER TABLE "Application" ADD CONSTRAINT "Application_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ApplicationMessage" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "html" TEXT NOT NULL DEFAULT '',
    "emailSubject" TEXT NOT NULL DEFAULT '',
    "emailMessageId" TEXT,
    "inReplyTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationMessage_applicationId_createdAt_idx" ON "ApplicationMessage"("applicationId", "createdAt");
CREATE INDEX "ApplicationMessage_emailMessageId_idx" ON "ApplicationMessage"("emailMessageId");

ALTER TABLE "ApplicationMessage" ADD CONSTRAINT "ApplicationMessage_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationMessage" ADD CONSTRAINT "ApplicationMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ApplicationAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationAttachment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ApplicationAttachment" ADD CONSTRAINT "ApplicationAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ApplicationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
