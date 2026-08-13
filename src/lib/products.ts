export const PRODUCT_IDS = ["keys", "group", "event"] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];

export const TICKET_TYPES = [
  { value: "standard", label: "Стандартный" },
  { value: "student", label: "Школьник / студент" },
  { value: "child", label: "Детский до 12 лет" },
] as const;

export type ProductConfig = {
  id: ProductId;
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

export const PRODUCTS: Record<ProductId, ProductConfig> = {
  keys: {
    id: "keys",
    slug: "keys",
    title: "Ключи от зала",
    kicker: "Частный сеанс",
    summary:
      "Забронируйте зал под свою компанию: фильм из расписания или свой вариант времени.",
    bullets: [
      "Город, кинотеатр, зал и сеанс из актуального расписания КАРО",
      "Можно указать своё время, если подходящего сеанса нет",
      "Заявка сразу попадает менеджеру в административную панель",
    ],
    cta: "Оставить заявку",
    fields: {
      hall: true,
      film: true,
      session: true,
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
      "Организуйте поход в кино для класса, команды или компании — подберём сеанс и тип билета.",
    bullets: [
      "Актуальные сеансы выбранного кинотеатра",
      "Тип билета: стандартный, школьник / студент, детский",
      "Количество гостей и пожелания в одной заявке",
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
      "Корпоратив, презентация, день рождения — зал и интервал аренды без привязки к сеансу.",
    bullets: [
      "Выбор города, кинотеатра и зала",
      "Желаемые дата и время аренды",
      "Описание мероприятия в комментарии",
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
  return PRODUCT_IDS.includes(value as ProductId);
}
