import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/admin/auth";
import { catalogErrorResponse } from "@/lib/catalog/http";
import { deleteCinema, getCinema, updateCinema } from "@/lib/catalog/service";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await context.params;
    const item = await getCinema(id);
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
    const item = await updateCinema(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      cityId: typeof body.cityId === "string" ? body.cityId : undefined,
      cityName: typeof body.cityName === "string" ? body.cityName : undefined,
      address:
        body.address === null || typeof body.address === "string"
          ? (body.address as string | null)
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
    await deleteCinema(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
