CREATE TABLE "ContactMailto" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMailto_pkey" PRIMARY KEY ("id")
);
