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
  "https://static.karofilm.ru/v3k/uploads/filemanager/%D0%9C%D0%B5%D1%80%D0%BE%D0%BF%D1%80%D0%B8%D1%8F%D1%82%D0%B8%D1%8F%20%20%D0%B2%20%D0%9A%D0%90%D0%A0%D0%9E%202023.pdf?_t=1681227349";

export type EventOccasion = {
  title: string;
  body: string;
};

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
    "Размещение тематических стендов, организация фуршетов / кофе-брейков в просторных фойе",
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
  occasions: [
    {
      title: "Выбери фильм",
      body: "Можешь выбрать из текущего репертуара на сайте либо запросить список всех доступных фильмов у менеджера после оформления заявки.",
    },
    {
      title: "День рождения",
      body: "Позови до 30 гостей и закажи закуски и напитки из нашего кинобара. Хочешь устроить уникальное поздравление? Покажи своё видео или презентацию на огромном экране кинотеатра.",
    },
    {
      title: "Игровая вечеринка",
      body: "Забронируй кинозал и играй в любимые игры на большом экране. Зови друзей и приноси игровую приставку. Стоимость указана за 2 часа бронирования.",
    },
    {
      title: "Необычное свидание",
      body: "Хочешь, чтобы в зале были только вы вдвоём? Собираешься сделать предложение на большом экране? Менеджеры вовремя выведут видео или презентацию и помогут сделать этот момент незабываемым.",
    },
  ],
  presentationLabel:
    "Ознакомиться с нашими возможностями можно в презентации",
  presentationHref: EVENT_PRESENTATION_HREF,
  enabled: true,
};
