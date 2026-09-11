export const PRODUCT_IDS = ["keys", "group", "event"] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];
export type StoredProductId = ProductId;

export const STORED_PRODUCT_IDS = PRODUCT_IDS;

export const TICKET_TYPES = [
  { value: "standard", label: "Стандартный" },
  { value: "student", label: "Школьник / студент" },
  { value: "child", label: "Детский до 12 лет" },
] as const;

export const GROUP_TICKET_TERMS = [
  "Групповая покупка — это возможность приобрести от 7 до 20 билетов на один сеанс одним заказом.",
  "Предложение действует при покупке от 7 до 20 билетов.",
  "Для покупки необходимо быть зарегистрированным и авторизованным участником программы лояльности КАРОНА.",
  "Стоимость билетов определяется выбранными кинотеатром, сеансом, залом, местами и действующими тарифами.",
  "Экономия 5%",
  "Групповые билеты доступны для покупки на любые сеансы, доступные для онлайн-продажи, если иное не предусмотрено условиями конкретного фильма.",
  "К заказу можно добавить продукцию кинобара.",
  "Возврат осуществляется для всего заказа целиком в соответствии с действующими правилами возврата билетов КАРО.",
] as const;

export type ProductConfig<I extends StoredProductId = StoredProductId> = {
  id: I;
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  bullets: string[];
  cta: string;
  termsLabel?: string;
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
    kicker: "В кино большой компанией — проще и выгоднее",
    summary:
      "От 7 до 20 билетов в одном заказе. Выгода 5% для участников программы лояльности КАРОНА.",
    bullets: [
      "От 7 до 20 билетов в одном заказе",
      "Выбирай любой доступный сеанс",
      "Доступны все типы билетов",
      "Выгода 5%",
      "Добавляй попкорн, напитки и другую продукцию кинобара",
      "Предложение доступно только для участников программы лояльности КАРОНА",
    ],
    cta: "Купить билеты",
    termsLabel: "Условия",
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
      "от камерного до главной премьерной площадки страны",
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
