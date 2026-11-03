import type { Application } from "@prisma/client";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatCreatedAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCreatedShort(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fromIsoLike(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (match) {
    const [, year, month, day, hour, minute] = match;
    return hour && minute ? `${day}.${month}.${year} ${hour}:${minute}` : `${day}.${month}.${year}`;
  }
  return raw;
}

export function eventDateLabel(
  item: Pick<
    Application,
    "rentalStart" | "rentalDate" | "rentalTime" | "sessionLabel" | "sessionCustom"
  >,
) {
  if (item.rentalStart) return fromIsoLike(item.rentalStart);
  if (item.rentalDate) {
    const date = fromIsoLike(item.rentalDate) || item.rentalDate;
    return item.rentalTime ? `${date} ${item.rentalTime}` : date;
  }
  const session = item.sessionLabel || item.sessionCustom || "";
  const sessionDate = session.match(/\d{2}\.\d{2}\.\d{4}/);
  return sessionDate ? sessionDate[0] : session;
}

export function publicApplicationCode(publicNumber: number) {
  return `KM-${publicNumber}`;
}

export function parsePublicNumber(text: string) {
  const match = text.match(/\bKM-(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

export function todayIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
