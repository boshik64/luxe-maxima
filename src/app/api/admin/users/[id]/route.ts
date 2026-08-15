import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/admin/auth";
import {
  deleteUser,
  getUser,
  updateUser,
  UserAdminError,
} from "@/lib/admin/users";
import { logger } from "@/lib/logger";

function errorResponse(error: unknown) {
  if (error instanceof UserAdminError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const status = (error as Error & { status?: number }).status;
  if (status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (status === 403) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  logger.error("Users request failed", error);
  return NextResponse.json({ error: "Не удалось обработать запрос" }, { status: 500 });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const item = await getUser(id);
    if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const role =
      body.role === Role.ADMIN || body.role === Role.OPERATOR
        ? body.role
        : undefined;
    const item = await updateUser(id, {
      email: typeof body.email === "string" ? body.email : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      password:
        typeof body.password === "string" && body.password
          ? body.password
          : undefined,
      role,
    });
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireRole(["ADMIN"]);
    const { id } = await context.params;
    await deleteUser(id, session.sub);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
