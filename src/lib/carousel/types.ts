export const CAROUSEL_MAX_SLIDES = 5;
export const CAROUSEL_MAX_KICKER = 30;
export const CAROUSEL_MAX_TITLE = 30;
export const CAROUSEL_MAX_BODY = 700;
export const CAROUSEL_MIN_INTERVAL = 3;
export const CAROUSEL_MAX_INTERVAL = 30;
export const CAROUSEL_DEFAULT_INTERVAL = 6;

/** Рекомендуемый размер картинки поста карусели. Любой кадр вписывается в 4:3. */
export const CAROUSEL_IMAGE_SPEC = {
  width: 1200,
  height: 900,
  ratio: "4:3",
  maxMb: 8,
  label:
    "Любой размер: кадр обрежется или растянется под 4:3. Удобнее всего 1200×900, JPG / PNG / WEBP до 8 МБ",
} as const;

/** Подсказки внутренних ссылок для кнопки поста. */
export const CAROUSEL_INTERNAL_LINKS = [
  { href: "#form", label: "Форма заявки на этой странице" },
  { href: "#products", label: "Блок услуг на главной" },
  { href: "/keys", label: "Страница «Кино на своих условиях»" },
  { href: "/keys#form", label: "Форма на странице ключей" },
  { href: "/event", label: "Страница мероприятий" },
  { href: "/event#form", label: "Форма на странице мероприятий" },
  { href: "/feedback", label: "Обратная связь" },
] as const;

export class CarouselHrefError extends Error {}

export function assertCarouselTextLimits(data: {
  kicker?: string;
  title?: string;
  body?: string;
}) {
  if (data.kicker !== undefined && data.kicker.trim().length > CAROUSEL_MAX_KICKER) {
    throw new Error(`Надзаголовок: максимум ${CAROUSEL_MAX_KICKER} символов`);
  }
  if (data.title !== undefined && data.title.trim().length > CAROUSEL_MAX_TITLE) {
    throw new Error(`Заголовок: максимум ${CAROUSEL_MAX_TITLE} символов`);
  }
  if (data.body !== undefined && data.body.trim().length > CAROUSEL_MAX_BODY) {
    throw new Error(`Текст: максимум ${CAROUSEL_MAX_BODY} символов`);
  }
}

/**
 * Внутренняя: `#form`, `/keys`, `/event#form`.
 * Внешняя: `https://…` (без протокола — домен тоже станет https).
 */
export function normalizeCarouselHref(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "#form";
  if (/^(javascript|data|vbscript):/i.test(raw)) {
    throw new CarouselHrefError("Недопустимая ссылка кнопки");
  }
  if (/^https?:\/\//i.test(raw) || /^mailto:/i.test(raw)) return raw;
  if (raw.startsWith("/") || raw.startsWith("#")) return raw;
  if (/^[a-z0-9][a-z0-9/_-]*(#.*)?$/i.test(raw)) return `/${raw}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i.test(raw)) return `https://${raw}`;
  throw new CarouselHrefError(
    "Укажите внутреннюю ссылку (#form, /keys) или внешнюю (https://…)",
  );
}

export function isExternalCarouselHref(href: string) {
  return /^(https?:\/\/|mailto:)/i.test(href.trim());
}

export const CAROUSEL_LAYOUTS = ["image-left", "image-right"] as const;
export type CarouselLayout = (typeof CAROUSEL_LAYOUTS)[number];

export function parseCarouselLayout(value: string | null | undefined): CarouselLayout {
  if (value === "image-right") return "image-right";
  return "image-left";
}

export type PublicCarouselSlide = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  alt: string;
  layout: CarouselLayout;
};

export type PublicCarousel = {
  intervalSeconds: number;
  items: PublicCarouselSlide[];
};
