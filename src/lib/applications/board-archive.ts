import { prisma } from "@/lib/db";
import { BOARD_ARCHIVE_AFTER_DAYS } from "@/lib/admin/status";
import { logger } from "@/lib/logger";

/**
 * «Выполнена» / «Не актуально» старше N дней уходят на доску «Архив».
 */
export async function moveStaleTerminalToArchiveBoard() {
  const cutoff = new Date(
    Date.now() - BOARD_ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000,
  );

  const result = await prisma.application.updateMany({
    where: {
      archived: false,
      status: { in: ["CLOSED", "REJECTED"] },
      statusEnteredAt: { lte: cutoff },
    },
    data: { archived: true },
  });

  if (result.count > 0) {
    logger.info("Moved stale terminal applications to archive board", {
      count: result.count,
      afterDays: BOARD_ARCHIVE_AFTER_DAYS,
    });
  }

  return { moved: result.count };
}
