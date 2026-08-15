import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/admin/auth";
import { catalogErrorResponse, requiredInt } from "@/lib/catalog/http";
import { deleteHall, getHall, updateHall } from "@/lib/catalog/service";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await context.params;
    const item = await getHall(id);
    if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return catalogErrorResponse(error);
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
    const item = await updateHall(id, {
      cinemaId: typeof body.cinemaId === "string" ? body.cinemaId : undefined,
      formatId: typeof body.formatId === "string" ? body.formatId : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      capacity:
        body.capacity !== undefined
          ? requiredInt(body.capacity, "Вместимость")
          : undefined,
      rentalPriceWeekday:
        body.rentalPriceWeekday !== undefined
          ? requiredInt(body.rentalPriceWeekday, "Стоимость пн–пт", 0)
          : undefined,
      rentalPriceWeekend:
        body.rentalPriceWeekend !== undefined
          ? requiredInt(body.rentalPriceWeekend, "Стоимость сб–вс", 0)
          : undefined,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
    });
    return NextResponse.json({ item });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    await deleteHall(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
