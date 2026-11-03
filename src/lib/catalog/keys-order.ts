/** Приказ 208/26 от 28.10.2026 — цены «Ключи от зала», приложение 1 и 2. */

export type KeysOrderHall = {
  hall: string;
  weekday: number;
  weekend: number;
  onRequest?: boolean;
  consoleGaming?: boolean;
};

export type KeysOrderCinema = {
  karoCinemaId: string;
  name: string;
  cityId: string;
  cityName: string;
  halls: KeysOrderHall[];
};

const rub = (thousands: number) => thousands * 1000;

export const KEYS_ORDER_CINEMAS: KeysOrderCinema[] = [
  {
    karoCinemaId: "10",
    name: "11 Октябрь",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [
      { hall: "3", weekday: rub(50), weekend: rub(70), consoleGaming: true },
      { hall: "6", weekday: rub(50), weekend: rub(70), consoleGaming: true },
      { hall: "9", weekday: rub(50), weekend: rub(70), consoleGaming: true },
      { hall: "10", weekday: rub(17), weekend: rub(20), consoleGaming: true },
      { hall: "11", weekday: rub(17), weekend: rub(20), consoleGaming: true },
    ],
  },
  {
    karoCinemaId: "35",
    name: "Sky 17 Авиапарк",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [
      { hall: "4", weekday: rub(45), weekend: rub(80), consoleGaming: true },
      { hall: "5", weekday: rub(45), weekend: rub(80), consoleGaming: true },
      { hall: "6", weekday: rub(45), weekend: rub(80), consoleGaming: true },
      { hall: "10", weekday: rub(40), weekend: rub(65), consoleGaming: true },
    ],
  },
  {
    karoCinemaId: "34",
    name: "Vegas 22",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [
      { hall: "18", weekday: rub(25), weekend: rub(30), consoleGaming: true },
      { hall: "19", weekday: rub(25), weekend: rub(30), consoleGaming: true },
      { hall: "20", weekday: rub(35), weekend: rub(40), consoleGaming: true },
      { hall: "21", weekday: rub(35), weekend: rub(40), consoleGaming: true },
    ],
  },
  {
    karoCinemaId: "3",
    name: "7 Атриум",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [
      { hall: "7", weekday: rub(40), weekend: rub(50) },
      { hall: "9", weekday: rub(50), weekend: rub(70) },
    ],
  },
  {
    karoCinemaId: "33",
    name: "10 Реутов",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [{ hall: "7", weekday: rub(17), weekend: rub(25), consoleGaming: true }],
  },
  {
    karoCinemaId: "44",
    name: "9 Vegas Каширский",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [{ hall: "1", weekday: rub(19), weekend: rub(30), consoleGaming: true }],
  },
  {
    karoCinemaId: "12",
    name: "6 Щука",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [{ hall: "8", weekday: rub(15), weekend: rub(17), consoleGaming: true }],
  },
  {
    karoCinemaId: "6",
    name: "5 Иридиум",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [
      { hall: "1", weekday: rub(17), weekend: rub(25) },
      { hall: "5", weekday: rub(12), weekend: rub(17), consoleGaming: true },
    ],
  },
  {
    karoCinemaId: "16",
    name: "7 Атмосфера",
    cityId: "2",
    cityName: "Санкт-Петербург",
    halls: [{ hall: "3", weekday: rub(11), weekend: rub(15) }],
  },
  {
    karoCinemaId: "21",
    name: "5 Невский-2",
    cityId: "2",
    cityName: "Санкт-Петербург",
    halls: [{ hall: "5", weekday: rub(11), weekend: rub(15) }],
  },
  {
    karoCinemaId: "19",
    name: "7 на Стачек",
    cityId: "2",
    cityName: "Санкт-Петербург",
    halls: [
      { hall: "6", weekday: rub(15), weekend: rub(20) },
      { hall: "7", weekday: rub(9), weekend: rub(11) },
    ],
  },
  {
    karoCinemaId: "warsaw-express",
    name: "9 Варшавский Экспресс",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [{ hall: "5", weekday: rub(17), weekend: rub(25) }],
  },
  {
    karoCinemaId: "18",
    name: "9 Континент на Звездной",
    cityId: "2",
    cityName: "Санкт-Петербург",
    halls: [{ hall: "4", weekday: rub(10), weekend: rub(12), consoleGaming: true }],
  },
  {
    karoCinemaId: "28",
    name: "8 Аура",
    cityId: "10",
    cityName: "Сургут",
    halls: [{ hall: "1", weekday: rub(11), weekend: rub(17), consoleGaming: true }],
  },
  {
    karoCinemaId: "24",
    name: "10 Радуга Парк",
    cityId: "5",
    cityName: "Екатеринбург",
    halls: [{ hall: "1", weekday: rub(10), weekend: rub(17), consoleGaming: true }],
  },
  {
    karoCinemaId: "25",
    name: "7 Калининград Плаза",
    cityId: "7",
    cityName: "Калининград",
    halls: [{ hall: "1", weekday: rub(12), weekend: rub(17) }],
  },
  {
    karoCinemaId: "53",
    name: "4 Высота",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [{ hall: "1", weekday: rub(20), weekend: rub(30) }],
  },
  {
    karoCinemaId: "58",
    name: "6 Будапешт",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [{ hall: "1", weekday: rub(15), weekend: rub(25) }],
  },
  {
    karoCinemaId: "59",
    name: "10 София",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [{ hall: "2", weekday: rub(20), weekend: rub(35) }],
  },
  {
    karoCinemaId: "67",
    name: "6 Киргизия",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [{ hall: "1", weekday: rub(20), weekend: rub(30) }],
  },
  {
    karoCinemaId: "50",
    name: "8 Саларис",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [{ hall: "8", weekday: rub(30), weekend: rub(55), consoleGaming: true }],
  },
  {
    karoCinemaId: "39",
    name: "13 Vegas Кунцево",
    cityId: "1",
    cityName: "Москва и МО",
    halls: [
      { hall: "1", weekday: 0, weekend: 0, onRequest: true },
      { hall: "2", weekday: rub(35), weekend: rub(50), consoleGaming: true },
      { hall: "3", weekday: rub(35), weekend: rub(50), consoleGaming: true },
      { hall: "6", weekday: rub(25), weekend: rub(30), consoleGaming: true },
    ],
  },
  {
    karoCinemaId: "38",
    name: "11 Охта",
    cityId: "2",
    cityName: "Санкт-Петербург",
    halls: [
      { hall: "1", weekday: rub(15), weekend: rub(25), consoleGaming: true },
      { hall: "2", weekday: rub(15), weekend: rub(25), consoleGaming: true },
      { hall: "11", weekday: rub(10), weekend: rub(15), consoleGaming: true },
    ],
  },
  {
    karoCinemaId: "51",
    name: "10 Галерея (Новосибирск)",
    cityId: "13",
    cityName: "Новосибирск",
    halls: [
      { hall: "4", weekday: rub(20), weekend: rub(26) },
      { hall: "7", weekday: rub(20), weekend: rub(26) },
      { hall: "8", weekday: rub(20), weekend: rub(26) },
    ],
  },
  {
    karoCinemaId: "42",
    name: "6 Колумб",
    cityId: "12",
    cityName: "Тюмень",
    halls: [{ hall: "1", weekday: rub(15), weekend: rub(20), consoleGaming: true }],
  },
  {
    karoCinemaId: "63",
    name: "8 Галерея (Краснодар)",
    cityId: "14",
    cityName: "Краснодар",
    halls: [{ hall: "3", weekday: rub(30), weekend: rub(50) }],
  },
];
