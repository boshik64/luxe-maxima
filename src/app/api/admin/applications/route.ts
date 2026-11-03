import { NextRequest, NextResponse } from "next/server";
import { ApplicationValidationError } from "@/lib/applications/errors";
import {
  applicationInputSchema,
  flattenErrors,
} from "@/lib/applications/schema";
import {
  createApplication,
  getApplication,
  listApplications,
} from "@/lib/applications/service";
import { requireSession } from "@/lib/admin/auth";
import { checkMailbox } from "@/lib/email/mailbox";
import { createClientId } from "@/lib/id";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const result = await listApplications({
    status: searchParams.get("status") ?? undefined,
    productId: searchParams.get("productId") ?? undefined,
    managerId: searchParams.get("managerId") ?? undefined,
    createdFrom: searchParams.get("createdFrom") ?? undefined,
    createdTo: searchParams.get("createdTo") ?? undefined,
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20) || 20,
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const raw =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const parsed = applicationInputSchema.safeParse({
    ...raw,
    consent: true,
    source:
      typeof raw.source === "string" && raw.source.trim()
        ? raw.source
        : "admin",
    idempotencyKey:
      typeof raw.idempotencyKey === "string" && raw.idempotencyKey
        ? raw.idempotencyKey
        : createClientId(),
    website: "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы", fields: flattenErrors(parsed.error) },
      { status: 422 },
    );
  }

  const mailboxError = await checkMailbox(parsed.data.email);
  if (mailboxError) {
    return NextResponse.json(
      { error: mailboxError, fields: { email: mailboxError } },
      { status: 422 },
    );
  }

  try {
    const result = await createApplication(parsed.data, {
      managerId: session.sub,
      skipRecentDuplicate: true,
    });
    const item = await getApplication(result.id);
    return NextResponse.json(
      { ...result, item },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof ApplicationValidationError) {
      return NextResponse.json(
        { error: error.message, fields: error.fields },
        { status: 422 },
      );
    }
    logger.error("Admin application create failed", error);
    return NextResponse.json(
      { error: "Не удалось создать заявку" },
      { status: 502 },
    );
  }
}
