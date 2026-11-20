import type { ApplicationStatus } from "@prisma/client";

export const STATUSES: ApplicationStatus[] = [
  "NEW",
  "WAITING_REPLY",
  "ANSWERED",
  "IN_PROGRESS",
  "CLOSED",
  "REJECTED",
];

/** Колонки основной доски. */
export const MAIN_BOARD_STATUSES: ApplicationStatus[] = [...STATUSES];

/** Колонки доски «Архив». */
export const ARCHIVE_BOARD_STATUSES = [
  "CLOSED",
  "REJECTED",
] as const satisfies readonly ApplicationStatus[];

export type ArchiveBoardStatus = (typeof ARCHIVE_BOARD_STATUSES)[number];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  NEW: "Новые заявки",
  WAITING_REPLY: "Ждем ответа",
  ANSWERED: "Отвечено",
  IN_PROGRESS: "В работе",
  CLOSED: "Выполнена",
  REJECTED: "Не актуально",
};

/** Подписи колонок на доске архива. */
export const ARCHIVE_STATUS_LABEL: Record<ArchiveBoardStatus, string> = {
  CLOSED: "Выполнены",
  REJECTED: "Архив",
};

export const STATUS_ACCENT: Record<ApplicationStatus, string> = {
  NEW: "#d4b37a",
  WAITING_REPLY: "#c9a227",
  ANSWERED: "#7ec8e3",
  IN_PROGRESS: "#6ea8ff",
  CLOSED: "#6fbf8a",
  REJECTED: "#9a9a9a",
};

export const ASSIGNING_STATUSES: ApplicationStatus[] = [
  "WAITING_REPLY",
  "ANSWERED",
  "IN_PROGRESS",
  "CLOSED",
  "REJECTED",
];

export const BOARD_ARCHIVE_AFTER_DAYS = 7;
