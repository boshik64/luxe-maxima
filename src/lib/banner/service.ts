import { randomUUID } from "node:crypto";
import type { SiteBanner } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { removeBannerUpload, bannerPublicUrl } from "@/lib/uploads";
import type { PublicBanner } from "@/lib/banner/types";

export const HOME_BANNER_SLOT = "home-hero-products";

export function isBannerPublished(value: unknown) {
  if (value === false || value === 0) return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized !== "false" &&
      normalized !== "f" &&
      normalized !== "0" &&
      normalized !== "no"
    );
  }
  return value !== false;
}

function normalizeBanner(item: SiteBanner | null): SiteBanner | null {
  if (!item) return null;
  return { ...item, enabled: isBannerPublished(item.enabled) };
}

type BannerDelegate = {
  findFirst: (args: { where: { slot: string; enabled?: boolean } }) => Promise<SiteBanner | null>;
  findUnique: (args: { where: { slot: string } }) => Promise<SiteBanner | null>;
  upsert: (args: {
    where: { slot: string };
    create: {
      slot: string;
      imageUrl: string;
      href: string | null;
      alt: string;
      enabled: boolean;
    };
    update: {
      imageUrl?: string;
      href?: string | null;
      alt?: string;
      enabled?: boolean;
    };
  }) => Promise<SiteBanner>;
  delete: (args: { where: { slot: string } }) => Promise<SiteBanner>;
};

function banners(): BannerDelegate | undefined {
  return (prisma as unknown as { siteBanner?: BannerDelegate }).siteBanner;
}

async function findBanner(slot: string): Promise<SiteBanner | null> {
  const delegate = banners();
  if (delegate) return normalizeBanner(await delegate.findUnique({ where: { slot } }));
  const rows = await prisma.$queryRaw<SiteBanner[]>`
    SELECT * FROM "SiteBanner" WHERE slot = ${slot} LIMIT 1
  `;
  return normalizeBanner(rows[0] ?? null);
}

export async function getPublicBanner(
  slot = HOME_BANNER_SLOT,
): Promise<PublicBanner | null> {
  try {
    const item = await findBanner(slot);
    if (!item?.imageUrl || !isBannerPublished(item.enabled)) return null;
    return {
      imageUrl: bannerPublicUrl(item.imageUrl),
      href: item.href,
      alt: item.alt,
      updatedAt: item.updatedAt.toISOString(),
    };
  } catch (error) {
    logger.error("Failed to load public banner", error);
    return null;
  }
}

export async function getBanner(slot = HOME_BANNER_SLOT) {
  return findBanner(slot);
}

export async function upsertBanner(data: {
  slot?: string;
  imageUrl?: string;
  href?: string | null;
  alt?: string;
  enabled?: boolean;
}) {
  const slot = data.slot ?? HOME_BANNER_SLOT;
  const current = await findBanner(slot);
  if (data.imageUrl && current?.imageUrl && current.imageUrl !== data.imageUrl) {
    await removeBannerUpload(current.imageUrl);
  }

  const delegate = banners();
  if (delegate) {
    return normalizeBanner(
      await delegate.upsert({
        where: { slot },
        create: {
          slot,
          imageUrl: data.imageUrl ?? "",
          href: data.href ?? null,
          alt: data.alt ?? "",
          enabled: data.enabled ?? true,
        },
        update: {
          ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
          ...(data.href !== undefined ? { href: data.href } : {}),
          ...(data.alt !== undefined ? { alt: data.alt } : {}),
          ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        },
      }),
    ) as SiteBanner;
  }

  const imageUrl = data.imageUrl ?? current?.imageUrl ?? "";
  const href = data.href !== undefined ? data.href : (current?.href ?? null);
  const alt = data.alt !== undefined ? data.alt : (current?.alt ?? "");
  const enabled = isBannerPublished(
    data.enabled !== undefined ? data.enabled : current?.enabled,
  );
  const id = current?.id ?? randomUUID();

  const rows = await prisma.$queryRaw<SiteBanner[]>`
    INSERT INTO "SiteBanner" (id, slot, "imageUrl", href, alt, enabled, "createdAt", "updatedAt")
    VALUES (${id}::text, ${slot}::text, ${imageUrl}::text, ${href}::text, ${alt}::text, ${enabled}::boolean, NOW(), NOW())
    ON CONFLICT (slot) DO UPDATE SET
      "imageUrl" = EXCLUDED."imageUrl",
      href = EXCLUDED.href,
      alt = EXCLUDED.alt,
      enabled = EXCLUDED.enabled,
      "updatedAt" = NOW()
    RETURNING *
  `;
  const item = normalizeBanner(rows[0] ?? null);
  if (!item) throw new Error("Не удалось сохранить баннер");
  return item;
}

export async function clearBanner(slot = HOME_BANNER_SLOT) {
  const current = await findBanner(slot);
  if (current?.imageUrl) await removeBannerUpload(current.imageUrl);
  if (!current) return;

  const delegate = banners();
  if (delegate) {
    await delegate.delete({ where: { slot } });
    return;
  }
  await prisma.$executeRaw`DELETE FROM "SiteBanner" WHERE slot = ${slot}`;
}
