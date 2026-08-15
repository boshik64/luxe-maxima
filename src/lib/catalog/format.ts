export function formatRubles(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

export function formatHallPrices(weekday: number, weekend: number) {
  return `пн–пт ${formatRubles(weekday)} · сб–вс ${formatRubles(weekend)}`;
}
