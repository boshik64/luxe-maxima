import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/admin/auth";
import { createUser, listUsers, UserAdminError } from "@/lib/admin/users";
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

function parseRole(value: unknown): Role {
  if (value === Role.ADMIN || value === Role.OPERATOR) return value;
  throw new UserAdminError("Выберите роль");
}

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const items = await listUsers();
    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = (await request.json()) as Record<string, unknown>;
    const item = await createUser({
      email: typeof body.email === "string" ? body.email : "",
      name: typeof body.name === "string" ? body.name : "",
      password: typeof body.password === "string" ? body.password : "",
      role: parseRole(body.role),
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
