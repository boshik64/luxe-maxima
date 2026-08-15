import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";

const SCHEMA_STAMP = "site-banner-v3";
const nodeRequire = createRequire(`${process.cwd()}/package.json`);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaStamp?: string;
};

function prismaLog(): ("error" | "warn")[] {
  return process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
}

function hasSiteBanner(client: PrismaClient) {
  return (
    typeof (client as unknown as { siteBanner?: { findFirst?: unknown } })
      .siteBanner?.findFirst === "function"
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
  if (hasSiteBanner(client)) return client;

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
    !hasSiteBanner(globalForPrisma.prisma))
) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaStamp = SCHEMA_STAMP;
}
