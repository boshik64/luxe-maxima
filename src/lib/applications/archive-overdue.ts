import { prisma } from "@/lib/db";
import { isEventPast } from "@/lib/applications/event-time";
import { logger } from "@/lib/logger";

/**
 * Карточки в «Ждем ответа», у которых время мероприятия уже прошло,
 * переносятся в «Не актуально». Повторно не трогаем (autoRejectedOverdue).
 */
export async function archiveOverdueWaitingApplications() {
  const candidates = await prisma.application.findMany({
    where: {
      status: "WAITING_REPLY",
      autoRejectedOverdue: false,
    },
    select: {
      id: true,
      rentalStart: true,
      rentalDate: true,
      rentalTime: true,
      sessionLabel: true,
      sessionCustom: true,
    },
  });

  const overdueIds = candidates
    .filter((item) => isEventPast(item))
    .map((item) => item.id);

  if (overdueIds.length === 0) return { archived: 0 };

  const result = await prisma.application.updateMany({
    where: {
      id: { in: overdueIds },
      status: "WAITING_REPLY",
      autoRejectedOverdue: false,
    },
    data: {
      status: "REJECTED",
      autoRejectedOverdue: true,
    },
  });

  if (result.count > 0) {
    logger.info("Archived overdue waiting applications", {
      count: result.count,
    });
  }

  return { archived: result.count };
}
