import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/admin/auth";
import {
  applicationAdminPatchSchema,
  flattenPatchErrors,
} from "@/lib/applications/admin-patch";
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from "@/lib/applications/service";
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
  const item = await getApplication(id);
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
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

  if (parsed.data.email) {
    const mailboxError = await checkMailbox(parsed.data.email);
    if (mailboxError) {
      return NextResponse.json(
        { error: mailboxError, fields: { email: mailboxError } },
        { status: 422 },
      );
    }
  }

  const updated = await updateApplication(id, parsed.data);
  return NextResponse.json({ item: updated });
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
