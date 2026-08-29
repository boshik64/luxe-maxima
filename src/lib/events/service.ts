import { prisma } from "@/lib/db";
import { CatalogError } from "@/lib/catalog/service";
import { logger } from "@/lib/logger";
import {
  DEFAULT_EVENT_PROMO,
  EVENT_PROMO_ID,
  EVENT_PROMO_MAX_INTRO,
  EVENT_PROMO_MAX_KICKER,
  EVENT_PROMO_MAX_LINE,
  EVENT_PROMO_MAX_OCCASION_BODY,
  EVENT_PROMO_MAX_OCCASION_TITLE,
  EVENT_PROMO_MAX_OCCASIONS,
  EVENT_PROMO_MAX_PRESENTATION,
  EVENT_PROMO_MAX_TITLE,
  type EventOccasion,
  type EventPromoContent,
  type PublicEventPromo,
} from "@/lib/events/types";

export {
  DEFAULT_EVENT_PROMO,
  EVENT_PRESENTATION_HREF,
  EVENT_PROMO_MAX_INTRO,
  EVENT_PROMO_MAX_KICKER,
  EVENT_PROMO_MAX_LINE,
  EVENT_PROMO_MAX_OCCASION_BODY,
  EVENT_PROMO_MAX_OCCASION_TITLE,
  EVENT_PROMO_MAX_OCCASIONS,
  EVENT_PROMO_MAX_PRESENTATION,
  EVENT_PROMO_MAX_TITLE,
} from "@/lib/events/types";

function promoClient() {
  const client = prisma as unknown as {
    eventPromo?: typeof prisma.eventPromo;
  };
  if (!client.eventPromo) {
    throw new CatalogError(
      "Сервер запущен со старой схемой БД. Перезапустите next dev.",
      500,
    );
  }
  return client as { eventPromo: NonNullable<typeof client.eventPromo> };
}

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function lines(value: unknown, maxItems = 12) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split("\n")
      : [];
  return source
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, EVENT_PROMO_MAX_LINE));
}

function parseOccasions(value: unknown): EventOccasion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = clip(row.title, EVENT_PROMO_MAX_OCCASION_TITLE);
      const body = clip(row.body, EVENT_PROMO_MAX_OCCASION_BODY);
      if (!title && !body) return null;
      return { title, body };
    })
    .filter((item): item is EventOccasion => item !== null)
    .slice(0, EVENT_PROMO_MAX_OCCASIONS);
}

function parseHref(value: unknown) {
  const href = clip(value, 500);
  if (!href) {
    throw new CatalogError("Укажите ссылку на презентацию");
  }
  if (!href.startsWith("https://") && !href.startsWith("http://") && !href.startsWith("/")) {
    throw new CatalogError("Ссылка на презентацию должна начинаться с https://");
  }
  return href;
}

function serialize(row: {
  kicker: string;
  title: string;
  intro: string;
  eventTypes: string[];
  capabilities: string[];
  highlights: string[];
  occasions: unknown;
  presentationLabel: string;
  presentationHref: string;
  enabled: boolean;
}): EventPromoContent {
  return {
    kicker: row.kicker,
    title: row.title,
    intro: row.intro,
    eventTypes: row.eventTypes,
    capabilities: row.capabilities,
    highlights: row.highlights,
    occasions: parseOccasions(row.occasions),
    presentationLabel: row.presentationLabel,
    presentationHref: row.presentationHref,
    enabled: row.enabled !== false,
  };
}

export async function getEventPromo(): Promise<EventPromoContent> {
  const row = await promoClient().eventPromo.upsert({
    where: { id: EVENT_PROMO_ID },
    create: {
      id: EVENT_PROMO_ID,
      ...DEFAULT_EVENT_PROMO,
      occasions: DEFAULT_EVENT_PROMO.occasions,
    },
    update: {},
  });
  return serialize(row);
}

export async function getPublicEventPromo(): Promise<PublicEventPromo | null> {
  try {
    const item = await getEventPromo();
    if (!item.enabled || !item.title.trim()) return null;
    return item;
  } catch (error) {
    logger.error("Failed to load event promo", error);
    return null;
  }
}

export async function saveEventPromo(data: Partial<EventPromoContent>) {
  const current = await getEventPromo();
  const next: EventPromoContent = {
    kicker: data.kicker !== undefined ? clip(data.kicker, EVENT_PROMO_MAX_KICKER) : current.kicker,
    title: data.title !== undefined ? clip(data.title, EVENT_PROMO_MAX_TITLE) : current.title,
    intro: data.intro !== undefined ? clip(data.intro, EVENT_PROMO_MAX_INTRO) : current.intro,
    eventTypes: data.eventTypes !== undefined ? lines(data.eventTypes) : current.eventTypes,
    capabilities:
      data.capabilities !== undefined ? lines(data.capabilities) : current.capabilities,
    highlights: data.highlights !== undefined ? lines(data.highlights, 6) : current.highlights,
    occasions:
      data.occasions !== undefined ? parseOccasions(data.occasions) : current.occasions,
    presentationLabel:
      data.presentationLabel !== undefined
        ? clip(data.presentationLabel, EVENT_PROMO_MAX_PRESENTATION)
        : current.presentationLabel,
    presentationHref:
      data.presentationHref !== undefined
        ? parseHref(data.presentationHref)
        : current.presentationHref,
    enabled: data.enabled !== undefined ? data.enabled === true : current.enabled,
  };
  if (!next.title) throw new CatalogError("Укажите заголовок блока");
  const row = await promoClient().eventPromo.upsert({
    where: { id: EVENT_PROMO_ID },
    create: { id: EVENT_PROMO_ID, ...next, occasions: next.occasions },
    update: { ...next, occasions: next.occasions },
  });
  return serialize(row);
}
