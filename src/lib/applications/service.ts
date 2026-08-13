import { ApplicationStatus, Prisma, ProductId } from "@prisma/client";
import type { ApplicationInput } from "@/lib/applications/schema";
import { prisma } from "@/lib/db";
import { CUSTOM_OPTION_ID } from "@/lib/karo/types";
import { notifyNewApplication } from "@/lib/email";
import { logger } from "@/lib/logger";

function catalogName(
  field?: { id?: string; name?: string; custom?: string } | null,
) {
  if (!field) return "";
  if (field.id === CUSTOM_OPTION_ID) return field.custom?.trim() || "Свой вариант";
  return field.name?.trim() || field.custom?.trim() || field.id || "";
}

function catalogId(field?: { id?: string } | null) {
  if (!field?.id || field.id === CUSTOM_OPTION_ID) return null;
  return field.id;
}

export async function createApplication(input: ApplicationInput) {
  const existing = await prisma.application.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return { id: existing.id, duplicate: true };
  }

  const duplicateWindow = new Date(Date.now() - 2 * 60 * 1000);
  const recent = await prisma.application.findFirst({
    where: {
      email: input.email,
      phone: input.phone,
      productId: input.productId,
      createdAt: { gte: duplicateWindow },
    },
  });
  if (recent) {
    return { id: recent.id, duplicate: true };
  }

  const application = await prisma.application.create({
    data: {
      productId: input.productId,
      source: input.source || "/",
      cityId: catalogId(input.city),
      cityName: catalogName(input.city),
      cinemaId: catalogId(input.cinema),
      cinemaName: catalogName(input.cinema),
      hallId: catalogId(input.hall),
      hallName: catalogName(input.hall) || null,
      filmId: catalogId(input.film),
      filmName: catalogName(input.film) || null,
      sessionId: catalogId(input.session),
      sessionLabel:
        input.session?.id === CUSTOM_OPTION_ID
          ? null
          : catalogName(input.session) || null,
      sessionCustom:
        input.session?.id === CUSTOM_OPTION_ID
          ? input.session.custom?.trim() || null
          : null,
      rentalDate: input.productId === "event" ? input.rentalDate || null : null,
      rentalTime: input.productId === "event" ? input.rentalTime || null : null,
      rentalDuration:
        input.productId === "event" ? input.rentalDuration || null : null,
      guests: input.guests ? Number(input.guests) : null,
      ticketType: input.productId === "group" ? input.ticketType || null : null,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email,
      comment: input.comment || null,
      consent: true,
      utmSource: input.utm?.source || null,
      utmMedium: input.utm?.medium || null,
      utmCampaign: input.utm?.campaign || null,
      utmContent: input.utm?.content || null,
      utmTerm: input.utm?.term || null,
      idempotencyKey: input.idempotencyKey,
    },
  });

  void notifyNewApplication(application).catch((error) => {
    logger.error("Email notification failed after save", error);
  });

  return { id: application.id };
}

export async function listApplications(params: {
  status?: string;
  productId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(10, params.pageSize ?? 20));
  const where: Prisma.ApplicationWhereInput = {};
  if (
    params.status &&
    (Object.values(ApplicationStatus) as string[]).includes(params.status)
  ) {
    where.status = params.status as ApplicationStatus;
  }
  if (
    params.productId &&
    (Object.values(ProductId) as string[]).includes(params.productId)
  ) {
    where.productId = params.productId as ProductId;
  }

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.application.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getApplication(id: string) {
  return prisma.application.findUnique({ where: { id } });
}

export async function updateApplication(
  id: string,
  data: Prisma.ApplicationUpdateInput,
) {
  return prisma.application.update({ where: { id }, data });
}

export async function deleteApplication(id: string) {
  return prisma.application.delete({ where: { id } });
}
