import type { ApplicationStatus } from "@prisma/client";

export const STATUSES: ApplicationStatus[] = [
  "NEW",
  "WAITING_REPLY",
  "ANSWERED",
  "IN_PROGRESS",
  "CLOSED",
  "REJECTED",
];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  NEW: "Новая",
  WAITING_REPLY: "Ждем ответа",
  ANSWERED: "Отвечено",
  IN_PROGRESS: "В работе",
  CLOSED: "Выполнена",
  REJECTED: "Не актуально",
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
