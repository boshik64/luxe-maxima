export function formatRubles(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

/** Labels for hall rental price bands (stored as weekday / weekend fields). */
export const HALL_PRICE_WEEKDAY_LABEL = "пн–чт";
export const HALL_PRICE_WEEKEND_LABEL = "пт–вс";

export function formatHallPrices(weekday: number, weekend: number) {
  return `${HALL_PRICE_WEEKDAY_LABEL} ${formatRubles(weekday)} · ${HALL_PRICE_WEEKEND_LABEL} ${formatRubles(weekend)}`;
}
