import type { CarouselLayout } from "@/lib/carousel/types";

/** Посты карусели с https://event.karofilm.ru/ */
export const CAROUSEL_EVENT_SLIDES: Array<{
  kicker: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageUrl2?: string;
  alt: string;
  alt2?: string;
  layout: CarouselLayout;
  enabled: boolean;
  sortOrder: number;
}> = [
  {
    kicker: "КАРО Ивент",
    title: "ВЫБЕРИ ФИЛЬМ",
    body: "Можешь выбрать из текущего репертуара на сайте либо запросить список всех доступных фильмов у менеджера после оформления заявки.",
    ctaLabel: "Забронировать",
    ctaHref: "#form",
    imageUrl: "/carousel/film-ivan.jpg",
    imageUrl2: "/carousel/film-myatezh.jpg",
    alt: "Как Иван в сказку попал",
    alt2: "Мятеж",
    layout: "image-left",
    enabled: true,
    sortOrder: 0,
  },
  {
    kicker: "КАРО Ивент",
    title: "ДЕНЬ РОЖДЕНИЯ",
    body: "Позови до 30 гостей и закажи закуски и напитки из нашего кинобара. Хочешь устроить уникальное поздравление? Покажи своё видео или презентацию на огромном экране кинотеатра.",
    ctaLabel: "Забронировать",
    ctaHref: "#form",
    imageUrl: "/carousel/birthday-1.jpg",
    imageUrl2: "/carousel/birthday-2.jpg",
    alt: "Компания в фойе кинотеатра КАРО",
    alt2: "День рождения в кинозале КАРО",
    layout: "image-right",
    enabled: true,
    sortOrder: 1,
  },
  {
    kicker: "КАРО Ивент",
    title: "ИГРОВАЯ ВЕЧЕРИНКА",
    body: "Забронируй кинозал и играй в любимые игры на большом экране. Зови друзей и приноси игровую приставку. Залы, в которых доступна услуга, отмечены специальным символом. Стоимость указана за 2 часа бронирования.",
    ctaLabel: "Забронировать",
    ctaHref: "#form",
    imageUrl: "/carousel/gaming-1.jpg",
    imageUrl2: "/carousel/gaming-2.jpg",
    alt: "Игровая вечеринка в кинотеатре КАРО",
    alt2: "Игра на большом экране в кинотеатре КАРО",
    layout: "image-left",
    enabled: true,
    sortOrder: 2,
  },
  {
    kicker: "КАРО Ивент",
    title: "НЕОБЫЧНОЕ СВИДАНИЕ",
    body: "Хочешь, чтобы в зале были только вы вдвоём? Собираешься сделать предложение на большом экране? Мы поможем: менеджеры вовремя выведут на экран видео или презентацию и помогут сделать этот момент незабываемым.",
    ctaLabel: "Забронировать",
    ctaHref: "#form",
    imageUrl: "/carousel/date.jpg",
    alt: "Свидание в кинозале КАРО",
    layout: "image-right",
    enabled: true,
    sortOrder: 3,
  },
  {
    kicker: "КАРО Ивент",
    title: "ЛЮБОЙ СЛОЖНОСТИ",
    body: "Организуем мероприятия любой сложности: премьеры, конференции, семинары и тренинги, крупные корпоративы и фуршеты. Оформление залов, тематические стенды, кофе-брейки в фойе, залы от 18 до 1509 гостей, премиум-форматы, фото и видеосъёмка.",
    ctaLabel: "Оставить заявку",
    ctaHref: "#form",
    imageUrl: "/carousel/events-1.jpg",
    imageUrl2: "/carousel/events-2.jpg",
    alt: "Мероприятие в зале кинотеатра КАРО",
    alt2: "Фуршет в кинотеатре КАРО",
    layout: "image-left",
    enabled: true,
    sortOrder: 4,
  },
];
