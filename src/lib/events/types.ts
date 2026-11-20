export const EVENT_PROMO_ID = "default";
export const EVENT_PROMO_MAX_KICKER = 40;
export const EVENT_PROMO_MAX_TITLE = 80;
export const EVENT_PROMO_MAX_INTRO = 400;
export const EVENT_PROMO_MAX_LINE = 200;
export const EVENT_PROMO_MAX_OCCASIONS = 6;
export const EVENT_PROMO_MAX_OCCASION_TITLE = 60;
export const EVENT_PROMO_MAX_OCCASION_BODY = 500;
export const EVENT_PROMO_MAX_PRESENTATION = 160;

export const EVENT_PRESENTATION_HREF =
  "https://static.karofilm.ru/v3k/uploads/filemanager/EVENT_KARO_2026.pdf?_t=1795164009";

export type EventOccasion = {
  title: string;
  body: string;
};

/** Иконки трёх акцентов с https://event.karofilm.ru/ */
export const EVENT_HIGHLIGHT_ICONS = [
  "/events/staff.png",
  "/events/av.png",
  "/events/equipment.png",
] as const;

export type EventPromoContent = {
  kicker: string;
  title: string;
  intro: string;
  eventTypes: string[];
  capabilities: string[];
  highlights: string[];
  occasions: EventOccasion[];
  presentationLabel: string;
  presentationHref: string;
  enabled: boolean;
};

export type PublicEventPromo = EventPromoContent;

/** Тексты с https://event.karofilm.ru/ */
export const DEFAULT_EVENT_PROMO: EventPromoContent = {
  kicker: "КАРО Ивент",
  title: "Организуем мероприятия любой сложности",
  intro:
    "Корпоратив, день рождения, презентация, необычное свидание — подберём зал специально для тебя.",
  eventTypes: [
    "Премьеры",
    "Конференции",
    "Семинары и тренинги",
    "Крупные корпоративные мероприятия",
    "Фуршеты",
  ],
  capabilities: [
    "Оформление помещений под ваши мероприятия",
    "Размещение тематических стендов",
    "Гибкие цены",
    "Использование нескольких зон кинотеатра",
    "Вместимость залов от 18 до 1509 гостей",
    "Премиум залы и форматы",
    "Фото и видеосъёмка",
  ],
  highlights: [
    "Обслуживающий персонал",
    "Полное техническое аудиовизуальное сопровождение",
    "Современное оборудование и большие экраны",
  ],
  occasions: [],
  presentationLabel:
    "Ознакомиться с нашими возможностями можно в презентации",
  presentationHref: EVENT_PRESENTATION_HREF,
  enabled: true,
};
