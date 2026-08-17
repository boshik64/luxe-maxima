import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const SCHEMA_STAMP = "carousel-v1";
const nodeRequire = createRequire(`${process.cwd()}/package.json`);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaStamp?: string;
};

function prismaLog(): ("error" | "warn")[] {
  return process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
}

function hasDelegate(
  client: PrismaClient,
  key: "siteBanner" | "carouselSlide" | "carouselSettings",
) {
  const delegate = (
    client as unknown as Record<string, { findMany?: unknown; findFirst?: unknown }>
  )[key];
  return (
    typeof delegate?.findMany === "function" ||
    typeof delegate?.findFirst === "function"
  );
}

function isCurrentPrisma(client: PrismaClient) {
  return (
    hasDelegate(client, "siteBanner") &&
    hasDelegate(client, "carouselSlide") &&
    hasDelegate(client, "carouselSettings")
  );
}

function forgetPrismaModules() {
  const cache = nodeRequire.cache;
  if (!cache) return;
  for (const key of Object.keys(cache)) {
    if (key.includes("@prisma/client") || key.includes(".prisma/client")) {
      delete cache[key];
    }
  }
}

function createPrisma(): PrismaClient {
  let client = new PrismaClient({ log: prismaLog() });
  if (isCurrentPrisma(client)) return client;

  void client.$disconnect();
  forgetPrismaModules();
  try {
    const Fresh = nodeRequire("@prisma/client").PrismaClient as typeof PrismaClient;
    client = new Fresh({ log: prismaLog() });
  } catch {
    client = new PrismaClient({ log: prismaLog() });
  }
  return client;
}

if (
  globalForPrisma.prisma &&
  (globalForPrisma.prismaSchemaStamp !== SCHEMA_STAMP ||
    !isCurrentPrisma(globalForPrisma.prisma))
) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaStamp = SCHEMA_STAMP;
}
