import type { ApplicationStatus } from "@prisma/client";

export const STATUSES: ApplicationStatus[] = [
  "NEW",
  "WAITING_REPLY",
  "ANSWERED",
  "IN_PROGRESS",
  "CLOSED",
  "REJECTED",
];

/** Колонки доски «Архив»: заявки в этих статусах живут только там. */
export const ARCHIVE_BOARD_STATUSES = [
  "CLOSED",
  "REJECTED",
] as const satisfies readonly ApplicationStatus[];

export type ArchiveBoardStatus = (typeof ARCHIVE_BOARD_STATUSES)[number];

/** Колонки основной доски (всё, кроме архивных статусов). */
export const MAIN_BOARD_STATUSES: ApplicationStatus[] = STATUSES.filter(
  (status) => !(ARCHIVE_BOARD_STATUSES as readonly ApplicationStatus[]).includes(status),
);

/** Заявка с таким статусом отображается только на доске «Архив». */
export function isArchiveStatus(status: ApplicationStatus) {
  return (ARCHIVE_BOARD_STATUSES as readonly ApplicationStatus[]).includes(
    status,
  );
}

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
