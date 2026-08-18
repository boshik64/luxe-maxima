import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { CatalogError } from "@/lib/catalog/service";
import { bannerPublicUrl, removeBannerUpload } from "@/lib/uploads";
import {
  CAROUSEL_DEFAULT_INTERVAL,
  CAROUSEL_MAX_INTERVAL,
  CAROUSEL_MAX_SLIDES,
  CAROUSEL_MIN_INTERVAL,
  CarouselHrefError,
  assertCarouselTextLimits,
  normalizeCarouselHref,
  parseCarouselLayout,
  type CarouselLayout,
  type PublicCarousel,
} from "@/lib/carousel/types";

export {
  CAROUSEL_DEFAULT_INTERVAL,
  CAROUSEL_IMAGE_SPEC,
  CAROUSEL_MAX_INTERVAL,
  CAROUSEL_MAX_SLIDES,
  CAROUSEL_MIN_INTERVAL,
  parseCarouselLayout,
} from "@/lib/carousel/types";

function carouselClient() {
  const client = prisma as unknown as {
    carouselSlide?: typeof prisma.carouselSlide;
    carouselSettings?: typeof prisma.carouselSettings;
  };
  if (!client.carouselSlide || !client.carouselSettings) {
    throw new CatalogError(
      "Сервер запущен со старой схемой БД. Перезапустите next dev.",
      500,
    );
  }
  return client as {
    carouselSlide: NonNullable<typeof client.carouselSlide>;
    carouselSettings: NonNullable<typeof client.carouselSettings>;
  };
}

export function carouselHttpError(error: unknown, fallback: string) {
  const status = (error as Error & { status?: number }).status;
  if (status === 401) return { error: "Unauthorized", status: 401 };
  if (error instanceof CatalogError) {
    return { error: error.message, status: error.status };
  }
  logger.error("Carousel admin request failed", error);
  const code = (error as { code?: string }).code;
  if (code === "P2021" || code === "P2022") {
    return {
      error:
        "Таблицы карусели не найдены. Выполните npx prisma migrate deploy и перезапустите сервер.",
      status: 500,
    };
  }
  return { error: fallback, status: 500 };
}

function clampInterval(value: number) {
  if (!Number.isFinite(value)) return CAROUSEL_DEFAULT_INTERVAL;
  return Math.min(
    CAROUSEL_MAX_INTERVAL,
    Math.max(CAROUSEL_MIN_INTERVAL, Math.round(value)),
  );
}

function toPublicImage(imageUrl: string) {
  if (imageUrl.startsWith("/autumn/") || imageUrl.startsWith("/carousel/") || imageUrl.startsWith("/halls/") || imageUrl.startsWith("http")) return imageUrl;
  return bannerPublicUrl(imageUrl);
}

function slideHref(value: string | null | undefined) {
  try {
    return normalizeCarouselHref(value);
  } catch (error) {
    if (error instanceof CarouselHrefError) {
      throw new CatalogError(error.message);
    }
    throw error;
  }
}

function publicHref(value: string | null | undefined) {
  try {
    return normalizeCarouselHref(value);
  } catch {
    return "#form";
  }
}

export async function getCarouselSettings() {
  const row = await carouselClient().carouselSettings.upsert({
    where: { id: "default" },
    create: { id: "default", intervalSeconds: CAROUSEL_DEFAULT_INTERVAL },
    update: {},
  });
  return { intervalSeconds: clampInterval(row.intervalSeconds) };
}

export async function setCarouselInterval(seconds: number) {
  const intervalSeconds = clampInterval(seconds);
  return carouselClient().carouselSettings.upsert({
    where: { id: "default" },
    create: { id: "default", intervalSeconds },
    update: { intervalSeconds },
  });
}

export async function listCarouselSlides(includeDisabled = false) {
  return carouselClient().carouselSlide.findMany({
    where: includeDisabled ? undefined : { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getPublicCarousel(): Promise<PublicCarousel> {
  try {
    const [settings, slides] = await Promise.all([
      getCarouselSettings(),
      listCarouselSlides(false),
    ]);
    return {
      intervalSeconds: settings.intervalSeconds,
      items: slides
        .filter((item) => item.imageUrl && item.title.trim())
        .map((item) => ({
          id: item.id,
          kicker: item.kicker,
          title: item.title,
          body: item.body,
          ctaLabel: item.ctaLabel,
          ctaHref: publicHref(item.ctaHref),
          imageUrl: toPublicImage(item.imageUrl),
          alt: item.alt || item.title,
          layout: parseCarouselLayout(item.layout),
        })),
    };
  } catch (error) {
    logger.error("Failed to load carousel", error);
    return { intervalSeconds: CAROUSEL_DEFAULT_INTERVAL, items: [] };
  }
}

export async function createCarouselSlide(data: {
  kicker?: string;
  title: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl: string;
  alt?: string;
  layout?: CarouselLayout;
  enabled?: boolean;
}) {
  const slides = carouselClient().carouselSlide;
  const count = await slides.count();
  if (count >= CAROUSEL_MAX_SLIDES) {
    throw new CatalogError(`Можно добавить не больше ${CAROUSEL_MAX_SLIDES} постов`);
  }
  const title = data.title.trim();
  if (!title) throw new CatalogError("Укажите заголовок поста");
  if (!data.imageUrl) throw new CatalogError("Загрузите изображение поста");
  try {
    assertCarouselTextLimits({
      kicker: data.kicker,
      title,
      body: data.body,
    });
  } catch (error) {
    throw new CatalogError(error instanceof Error ? error.message : "Слишком длинный текст");
  }

  return slides.create({
    data: {
      kicker: data.kicker?.trim() ?? "",
      title,
      body: data.body?.trim() ?? "",
      ctaLabel: data.ctaLabel?.trim() ?? "",
      ctaHref: slideHref(data.ctaHref),
      imageUrl: data.imageUrl,
      alt: data.alt?.trim() ?? "",
      layout: parseCarouselLayout(data.layout),
      enabled: data.enabled === true,
      sortOrder: count,
    },
  });
}

export async function updateCarouselSlide(
  id: string,
  data: {
    kicker?: string;
    title?: string;
    body?: string;
    ctaLabel?: string;
    ctaHref?: string;
    imageUrl?: string;
    alt?: string;
    layout?: CarouselLayout;
    enabled?: boolean;
    sortOrder?: number;
  },
) {
  const slides = carouselClient().carouselSlide;
  const current = await slides.findUnique({ where: { id } });
  if (!current) throw new CatalogError("Пост не найден", 404);
  try {
    assertCarouselTextLimits({
      kicker: data.kicker,
      title: data.title,
      body: data.body,
    });
  } catch (error) {
    throw new CatalogError(error instanceof Error ? error.message : "Слишком длинный текст");
  }

  if (data.imageUrl && current.imageUrl && data.imageUrl !== current.imageUrl) {
    await removeBannerUpload(current.imageUrl);
  }

  return slides.update({
    where: { id },
    data: {
      ...(data.kicker !== undefined ? { kicker: data.kicker.trim() } : {}),
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.body !== undefined ? { body: data.body.trim() } : {}),
      ...(data.ctaLabel !== undefined ? { ctaLabel: data.ctaLabel.trim() } : {}),
      ...(data.ctaHref !== undefined ? { ctaHref: slideHref(data.ctaHref) } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.alt !== undefined ? { alt: data.alt.trim() } : {}),
      ...(data.layout !== undefined ? { layout: parseCarouselLayout(data.layout) } : {}),
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  });
}

export async function deleteCarouselSlide(id: string) {
  const slides = carouselClient().carouselSlide;
  const current = await slides.findUnique({ where: { id } });
  if (!current) return;
  if (current.imageUrl) await removeBannerUpload(current.imageUrl);
  await slides.delete({ where: { id } });
}
