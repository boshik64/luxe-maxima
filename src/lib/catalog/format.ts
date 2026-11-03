export function formatRubles(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

/** Labels for hall rental price bands (stored as weekday / weekend fields). */
export const HALL_PRICE_WEEKDAY_LABEL = "пн–чт";
export const HALL_PRICE_WEEKEND_LABEL = "пт–вс";

export const HALL_HOLIDAY_PRICE_NOTE =
  "Стоимость бронирования зала в предпраздничные и праздничные дни — по цене выходного дня.";

export const CONSOLE_GAMING_LABEL = "Можно играть в приставку";

export function formatHallPrices(weekday: number, weekend: number, onRequest = false) {
  if (onRequest) return "по запросу";
  return `${HALL_PRICE_WEEKDAY_LABEL} ${formatRubles(weekday)} · ${HALL_PRICE_WEEKEND_LABEL} ${formatRubles(weekend)}`;
}
