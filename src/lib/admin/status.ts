import type { ApplicationStatus } from "@prisma/client";

export const STATUSES: ApplicationStatus[] = [
  "NEW",
  "IN_PROGRESS",
  "CLOSED",
  "REJECTED",
];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  CLOSED: "Закрыта",
  REJECTED: "Отклонена",
};

export const STATUS_ACCENT: Record<ApplicationStatus, string> = {
  NEW: "#d4b37a",
  IN_PROGRESS: "#6ea8ff",
  CLOSED: "#6fbf8a",
  REJECTED: "#e91a3b",
};
