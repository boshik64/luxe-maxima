import { FeedbackStatus, Prisma } from "@prisma/client";
import type { FeedbackInput } from "@/lib/feedback/schema";
import { prisma } from "@/lib/db";
import { notifyNewFeedback } from "@/lib/email";
import { logger } from "@/lib/logger";

export async function createFeedback(input: FeedbackInput) {
  const existing = await prisma.feedback.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return { id: existing.id, duplicate: true };

  const item = await prisma.feedback.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      topic: "other",
      message: input.message,
      consent: true,
      source: input.source || "/feedback",
      idempotencyKey: input.idempotencyKey,
    },
  });

  void notifyNewFeedback(item).catch((error) => {
    logger.error("Feedback email failed after save", error);
  });

  return { id: item.id };
}

export async function listFeedback(params: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 20));
  const where: Prisma.FeedbackWhereInput = {};
  if (
    params.status &&
    (Object.values(FeedbackStatus) as string[]).includes(params.status)
  ) {
    where.status = params.status as FeedbackStatus;
  }

  const [items, total, newCount] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.feedback.count({ where }),
    prisma.feedback.count({ where: { status: FeedbackStatus.NEW } }),
  ]);

  return { items, total, page, pageSize, newCount };
}

export async function getFeedback(id: string) {
  return prisma.feedback.findUnique({ where: { id } });
}

export async function updateFeedback(
  id: string,
  data: { status?: FeedbackStatus; adminComment?: string },
) {
  return prisma.feedback.update({
    where: { id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.adminComment !== undefined
        ? { adminComment: data.adminComment }
        : {}),
    },
  });
}
