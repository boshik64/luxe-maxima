import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/admin/auth";
import {
  catalogErrorResponse,
  parseBenefits,
} from "@/lib/catalog/http";
import { deleteFormat, getFormat, updateFormat } from "@/lib/catalog/service";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await context.params;
    const item = await getFormat(id);
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
    const item = await updateFormat(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      benefits: body.benefits !== undefined ? parseBenefits(body.benefits) : undefined,
      imageUrl:
        body.imageUrl === null || typeof body.imageUrl === "string"
          ? (body.imageUrl as string | null)
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
    await deleteFormat(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
