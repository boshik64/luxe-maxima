import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import { CatalogError } from "@/lib/catalog/service";
import { getEventPromo, saveEventPromo } from "@/lib/events/service";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  if (status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof CatalogError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  logger.error("Event promo admin request failed", error);
  const code = (error as { code?: string }).code;
  if (code === "P2021" || code === "P2022") {
    return NextResponse.json(
      {
        error:
          "Таблица блока мероприятий не найдена. Выполните npx prisma migrate deploy и перезапустите сервер.",
      },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { error: "Не удалось сохранить блок мероприятий" },
    { status: 500 },
  );
}

function revalidateHome() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
  } catch {
    // страница обновится при следующем запросе
  }
}

export async function GET() {
  try {
    await requireSession();
    const item = await getEventPromo();
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const item = await saveEventPromo({
      kicker: typeof body.kicker === "string" ? body.kicker : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      intro: typeof body.intro === "string" ? body.intro : undefined,
      eventTypes: body.eventTypes !== undefined ? (body.eventTypes as string[]) : undefined,
      capabilities:
        body.capabilities !== undefined ? (body.capabilities as string[]) : undefined,
      highlights: body.highlights !== undefined ? (body.highlights as string[]) : undefined,
      occasions: Array.isArray(body.occasions) ? body.occasions : undefined,
      presentationLabel:
        typeof body.presentationLabel === "string" ? body.presentationLabel : undefined,
      presentationHref:
        typeof body.presentationHref === "string" ? body.presentationHref : undefined,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
    });
    revalidateHome();
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
