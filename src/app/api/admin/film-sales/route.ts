import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import {
  listFilmSaleMechanics,
  saveFilmSaleMechanics,
} from "@/lib/films/sale-mechanics";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  if (status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const code = (error as { code?: string }).code;
  if (code === "P2021" || code === "P2022") {
    return NextResponse.json(
      {
        error:
          "Таблица механик продажи не найдена. Выполните npx prisma migrate deploy и перезапустите сервер.",
      },
      { status: 500 },
    );
  }
  logger.error("Film sale mechanics admin request failed", error);
  return NextResponse.json(
    { error: "Не удалось сохранить механики продажи" },
    { status: 500 },
  );
}

export async function GET() {
  try {
    await requireSession();
    const items = await listFilmSaleMechanics();
    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSession();
    const body = (await request.json()) as {
      items?: Array<{ saleId?: unknown; enabled?: unknown; label?: unknown }>;
    };
    const items = Array.isArray(body.items)
      ? body.items
          .map((item) => ({
            saleId: Number(item.saleId),
            enabled: Boolean(item.enabled),
            label: typeof item.label === "string" ? item.label : "",
          }))
          .filter((item) => Number.isFinite(item.saleId))
      : [];
    const saved = await saveFilmSaleMechanics(items);
    return NextResponse.json({ items: saved });
  } catch (error) {
    return errorResponse(error);
  }
}
