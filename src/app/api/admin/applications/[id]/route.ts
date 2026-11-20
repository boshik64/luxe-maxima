import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireRole, requireSession } from "@/lib/admin/auth";
import { ASSIGNING_STATUSES } from "@/lib/admin/status";
import {
  applicationAdminPatchSchema,
  flattenPatchErrors,
} from "@/lib/applications/admin-patch";
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from "@/lib/applications/service";
import { prisma } from "@/lib/db";
import { checkMailbox } from "@/lib/email/mailbox";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  // Почту не трогаем здесь: иначе каждый refresh карточки/чата долбит EWS.
  // Входящие — cron и GET .../messages.
  const item = await getApplication(id);
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = applicationAdminPatchSchema.safeParse(body);
  if (!parsed.success) {
    const fields = flattenPatchErrors(parsed.error);
    return NextResponse.json(
      {
        error: Object.values(fields)[0] ?? "Проверьте поля формы",
        fields,
      },
      { status: 422 },
    );
  }

  const existing = await getApplication(id);
  if (!existing) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  // Проверяем ящик только если email реально меняют — иначе каждое «Сохранить» ждёт DNS/SMTP.
  if (
    parsed.data.email &&
    parsed.data.email.trim().toLowerCase() !== existing.email.trim().toLowerCase()
  ) {
    const mailboxError = await checkMailbox(parsed.data.email);
    if (mailboxError) {
      return NextResponse.json(
        { error: mailboxError, fields: { email: mailboxError } },
        { status: 422 },
      );
    }
  }

  const { managerId, archived, ...fields } = parsed.data;
  const data: Prisma.ApplicationUpdateInput = { ...fields };

  if (parsed.data.status && parsed.data.status !== existing.status) {
    data.statusEnteredAt = new Date();
    // Возврат в активный статус снимает с доски «Архив».
    if (
      parsed.data.status !== "CLOSED" &&
      parsed.data.status !== "REJECTED"
    ) {
      data.archived = false;
    }
  }

  if (archived === true) {
    data.archived = true;
    if (
      existing.status !== "CLOSED" &&
      existing.status !== "REJECTED" &&
      !parsed.data.status
    ) {
      data.status = "REJECTED";
      data.statusEnteredAt = new Date();
    }
  } else if (archived === false) {
    data.archived = false;
  }

  if (managerId !== undefined) {
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { id: true },
      });
      if (!manager) {
        return NextResponse.json(
          { error: "Менеджер не найден", fields: { managerId: "Менеджер не найден" } },
          { status: 422 },
        );
      }
      data.manager = { connect: { id: managerId } };
    } else {
      data.manager = { disconnect: true };
    }
  } else if (parsed.data.status === "NEW") {
    data.manager = { disconnect: true };
  } else if (
    parsed.data.status &&
    ASSIGNING_STATUSES.includes(parsed.data.status) &&
    !existing.managerId
  ) {
    data.manager = { connect: { id: session.sub } };
  }

  try {
    const updated = await updateApplication(id, data);
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Application PATCH failed", error);
    return NextResponse.json(
      { error: "Не удалось сохранить заявку" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["ADMIN"]);
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const { id } = await context.params;
  await deleteApplication(id);
  return NextResponse.json({ ok: true });
}
