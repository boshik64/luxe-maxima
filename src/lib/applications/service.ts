import { ApplicationStatus, Prisma, ProductId } from "@prisma/client";
import { ApplicationValidationError } from "@/lib/applications/errors";
import type { ApplicationInput } from "@/lib/applications/schema";
import { getEnabledHall } from "@/lib/catalog/service";
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

  const rental = input.productId === "keys" || input.productId === "event";
  let hallName = catalogName(input.hall) || null;
  let hallFormatName: string | null = catalogName(input.hallFormat) || null;
  let hallCapacity: number | null = null;
  let hallRentalPrice: number | null = null;
  let hallRentalPriceWeekday: number | null = null;
  let hallRentalPriceWeekend: number | null = null;
  let cinemaName = catalogName(input.cinema);
  let cinemaId = catalogId(input.cinema);

  if (rental) {
    const hallId = catalogId(input.hall);
    const hall = hallId ? await getEnabledHall(hallId) : null;
    if (!hall || hall.cinemaId !== cinemaId) {
      throw new ApplicationValidationError({
        "hall.id": "Зал недоступен для аренды. Обновите страницу и выберите зал снова.",
      });
    }
    hallName = hall.name;
    hallFormatName = hall.format.name;
    hallCapacity = hall.capacity;
    hallRentalPrice = hall.rentalPriceWeekday;
    hallRentalPriceWeekday = hall.rentalPriceWeekday;
    hallRentalPriceWeekend = hall.rentalPriceWeekend;
    cinemaName = hall.cinema.name;
    cinemaId = hall.cinema.id;
  }

  const watchCustom =
    input.productId === "keys" ? input.watchCustom?.trim() || null : null;
  const filmId = watchCustom ? null : catalogId(input.film);
  const filmName = watchCustom
    ? watchCustom
    : catalogName(input.film) || null;

  const application = await prisma.application.create({
    data: {
      productId: input.productId,
      source: input.source || "/",
      cityId: catalogId(input.city),
      cityName: catalogName(input.city),
      cinemaId,
      cinemaName,
      hallId: catalogId(input.hall),
      hallName,
      hallFormatName,
      hallCapacity,
      hallRentalPrice,
      hallRentalPriceWeekday,
      hallRentalPriceWeekend,
      filmId,
      filmName,
      watchCustom,
      sessionId: catalogId(input.session),
      sessionLabel:
        input.session?.id === CUSTOM_OPTION_ID
          ? null
          : catalogName(input.session) || null,
      sessionCustom:
        input.session?.id === CUSTOM_OPTION_ID
          ? input.session.custom?.trim() || null
          : null,
      rentalDate:
        input.productId === "event" || input.productId === "keys"
          ? input.rentalStart?.slice(0, 10) || null
          : null,
      rentalTime:
        input.productId === "event" || input.productId === "keys"
          ? input.rentalStart?.slice(11, 16) || null
          : null,
      rentalDuration: null,
      rentalStart: input.productId === "event" ? input.rentalStart || null : null,
      rentalEnd: null,
      guests: input.guests ? Number(input.guests) : null,
      ticketType: null,
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
