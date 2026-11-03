const MOSCOW_TZ = "Europe/Moscow";

export const WORK_HOURS_NOTE =
  "Рабочее время с понедельника по пятницу с 10:00 до 19:00 по мск. Заявки, оформленные в выходные и нерабочее время, обрабатываются в рабочие часы.";

export function moscowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MOSCOW_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return { weekday, hour, minute };
}

/** Пн–пт 10:00–19:00 МСК. 19:00 уже нерабочее. */
export function isOutsideWorkingHours(date = new Date()) {
  const { weekday, hour, minute } = moscowParts(date);
  const weekend = weekday === "Sat" || weekday === "Sun";
  if (weekend) return true;
  const minutes = hour * 60 + minute;
  return minutes < 10 * 60 || minutes >= 19 * 60;
}
