export const PRODUCT_IDS = ["keys", "group", "event"] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];
export type StoredProductId = ProductId;

export const STORED_PRODUCT_IDS = PRODUCT_IDS;

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
    kicker: "Приватный сеанс",
    summary:
      "Полная приватность: зал только для вашей компании — без посторонних зрителей.",
    bullets: [
      "Полная приватность: зал только для вашей компании — без посторонних зрителей",
      "Индивидуальное время: сеанс стартует по вашему расписанию",
      "Просмотр своего контента: ролик, презентация или запись",
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
    title: "Групповой билет",
    kicker: "Коллективный просмотр",
    summary: "Пригласи в кино целый класс или компанию друзей.",
    bullets: [
      "Пригласи в кино целый класс или компанию друзей",
      "Специальные условия для компании от семи человек, выгода до 10%",
      "Доступны детские билеты до 12 лет, а также билеты школьникам и студентам",
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
    kicker: "Для особого случая",
    summary:
      "Корпоратив, романтичное свидание, день рождения или вечеринка — индивидуальное время и сервис под ключ.",
    bullets: [
      "Корпоратив, романтичное свидание, день рождения или вечеринка — индивидуальное время и сервис под ключ",
      "Выбери свой зал: от камерного на полтора десятка гостей до главной премьерной площадки страны",
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
