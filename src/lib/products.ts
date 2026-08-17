export const PRODUCT_IDS = ["keys", "event"] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];

/** Снято с лендинга, но строки в БД и админке ещё могут быть. */
export const ARCHIVED_PRODUCT_IDS = ["group"] as const;
export type ArchivedProductId = (typeof ARCHIVED_PRODUCT_IDS)[number];
export type StoredProductId = ProductId | ArchivedProductId;

export const STORED_PRODUCT_IDS = [
  ...PRODUCT_IDS,
  ...ARCHIVED_PRODUCT_IDS,
] as const;

export const TICKET_TYPES = [
  { value: "standard", label: "Стандартный" },
  { value: "student", label: "Школьник / студент" },
  { value: "child", label: "Детский до 12 лет" },
] as const;

export type ProductConfig<I extends StoredProductId = StoredProductId> = {
  id: I;
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  bullets: string[];
  cta: string;
  fields: {
    hall: boolean;
    film: boolean;
    session: boolean;
    rentalTime: boolean;
    guests: boolean;
    ticketType: boolean;
  };
};

export const PRODUCTS: { [K in StoredProductId]: ProductConfig<K> } = {
  keys: {
    id: "keys",
    slug: "keys",
    title: "Ключи от зала",
    kicker: "Частный сеанс",
    summary:
      "Весь зал только для своих: любимый фильм из репертуара или ваше видео на большом экране.",
    bullets: [
      "Зал под компанию — от камерного на полтора десятка кресел до большого",
      "Формат зала, вместимость и стоимость видно сразу при выборе",
      "Свой контент: ролик, презентация или запись — согласуем с менеджером",
    ],
    cta: "Оставить заявку",
    fields: {
      hall: true,
      film: true,
      session: false,
      rentalTime: false,
      guests: true,
      ticketType: false,
    },
  },
  group: {
    id: "group",
    slug: "group",
    title: "Групповые походы",
    kicker: "Групповые билеты",
    summary:
      "Ведёте класс, команду или друзей? Займём для вас ряды на ближайшем сеансе.",
    bullets: [
      "Живое расписание: выбираете день, время и зал в пару кликов",
      "Школьные, студенческие и детские билеты — в одной заявке",
      "Сидите вместе: компания не разбредается по залу",
    ],
    cta: "Оставить заявку",
    fields: {
      hall: false,
      film: true,
      session: true,
      rentalTime: false,
      guests: true,
      ticketType: true,
    },
  },
  event: {
    id: "event",
    slug: "event",
    title: "Мероприятие в КАРО",
    kicker: "Аренда под ивент",
    summary:
      "Корпоратив, презентация или день рождения в кинозале — берём зал на нужное вам время.",
    bullets: [
      "Аренда на несколько часов или дней, без привязки к расписанию сеансов",
      "Экран и звук под вашу программу: показ, награждение, презентация",
      "Кинотеатр в центре города вместо очередной переговорной",
    ],
    cta: "Оставить заявку",
    fields: {
      hall: true,
      film: false,
      session: false,
      rentalTime: true,
      guests: true,
      ticketType: false,
    },
  },
};

export const PRODUCT_LIST = PRODUCT_IDS.map((id) => PRODUCTS[id]);

export function isProductId(value: string): value is ProductId {
  return (PRODUCT_IDS as readonly string[]).includes(value);
}

export function isStoredProductId(value: string): value is StoredProductId {
  return (STORED_PRODUCT_IDS as readonly string[]).includes(value);
}
