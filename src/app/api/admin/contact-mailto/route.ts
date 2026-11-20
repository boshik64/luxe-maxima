import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/admin/auth";
import { CatalogError } from "@/lib/catalog/service";
import { getContactMailto, saveContactMailto } from "@/lib/contacts/service";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  if (status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (status === 403) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (error instanceof CatalogError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  logger.error("Contact mailto admin request failed", error);
  const code = (error as { code?: string }).code;
  if (code === "P2021" || code === "P2022") {
    return NextResponse.json(
      {
        error:
          "Таблица шаблона письма не найдена. Выполните npx prisma migrate deploy и перезапустите сервер.",
      },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { error: "Не удалось сохранить шаблон письма" },
    { status: 500 },
  );
}

function revalidateContacts() {
  try {
    revalidatePath("/feedback");
  } catch {
    // страница обновится при следующем запросе
  }
}

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const item = await getContactMailto();
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const body = (await request.json()) as Record<string, unknown>;
    const item = await saveContactMailto({
      subject: typeof body.subject === "string" ? body.subject : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
    });
    revalidateContacts();
    return NextResponse.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
