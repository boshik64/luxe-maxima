import { NextRequest, NextResponse } from "next/server";
import { FeedbackStatus } from "@prisma/client";
import { requireSession } from "@/lib/admin/auth";
import { getFeedback, updateFeedback } from "@/lib/feedback/service";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await context.params;
    const item = await getFeedback(id);
    if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    if ((error as Error & { status?: number }).status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("Feedback get failed", error);
    return NextResponse.json({ error: "Не найдено" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const status =
      typeof body.status === "string" &&
      (Object.values(FeedbackStatus) as string[]).includes(body.status)
        ? (body.status as FeedbackStatus)
        : undefined;
    const item = await updateFeedback(id, {
      status,
      adminComment:
        typeof body.adminComment === "string" ? body.adminComment : undefined,
    });
    return NextResponse.json({ item });
  } catch (error) {
    if ((error as Error & { status?: number }).status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    logger.error("Feedback update failed", error);
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }
}
