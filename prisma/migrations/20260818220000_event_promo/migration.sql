CREATE TABLE "EventPromo" (
    "id" TEXT NOT NULL,
    "kicker" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "intro" TEXT NOT NULL DEFAULT '',
    "eventTypes" TEXT[] NOT NULL,
    "capabilities" TEXT[] NOT NULL,
    "highlights" TEXT[] NOT NULL,
    "occasions" JSONB NOT NULL,
    "presentationLabel" TEXT NOT NULL,
    "presentationHref" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPromo_pkey" PRIMARY KEY ("id")
);
