import type { Application } from "@prisma/client";

type EventFields = Pick<
  Application,
  "rentalStart" | "rentalDate" | "rentalTime" | "sessionLabel" | "sessionCustom"
>;

const HOUR_MS = 60 * 60 * 1000;

/** Парсит дату/время мероприятия из полей заявки (МСК как локальное wall-clock). */
export function parseEventStart(item: EventFields): Date | null {
  const start = item.rentalStart?.trim();
  if (start) {
    const iso = start.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/,
    );
    if (iso) {
      const [, y, m, d, hh = "00", mm = "00", ss = "00"] = iso;
      const date = new Date(
        Number(y),
        Number(m) - 1,
        Number(d),
        Number(hh),
        Number(mm),
        Number(ss),
      );
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const parsed = new Date(start);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const rentalDate = item.rentalDate?.trim();
  if (rentalDate) {
    const match = rentalDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      let hour = 0;
      let minute = 0;
      const time = item.rentalTime?.trim().match(/^(\d{1,2}):(\d{2})/);
      if (time) {
        hour = Number(time[1]);
        minute = Number(time[2]);
      }
      const date = new Date(Number(y), Number(m) - 1, Number(d), hour, minute);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const session = (item.sessionLabel || item.sessionCustom || "").trim();
  if (session) {
    const ru = session.match(
      /(\d{2})\.(\d{2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/,
    );
    if (ru) {
      const [, d, m, y, hh = "0", mm = "0"] = ru;
      const date = new Date(
        Number(y),
        Number(m) - 1,
        Number(d),
        Number(hh),
        Number(mm),
      );
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

export function isEventPast(item: EventFields, now = new Date()) {
  const start = parseEventStart(item);
  if (!start) return false;
  return start.getTime() < now.getTime();
}

/** Часы до начала; null если даты нет или мероприятие уже прошло. */
export function hoursUntilEvent(item: EventFields, now = new Date()) {
  const start = parseEventStart(item);
  if (!start) return null;
  const diff = start.getTime() - now.getTime();
  if (diff < 0) return null;
  return diff / HOUR_MS;
}

export function isWithinHours(
  item: EventFields,
  hours: number,
  now = new Date(),
) {
  const until = hoursUntilEvent(item, now);
  return until != null && until <= hours;
}
