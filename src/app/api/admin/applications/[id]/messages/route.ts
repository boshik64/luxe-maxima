import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import { getApplication } from "@/lib/applications/service";
import { pollInboundMailbox } from "@/lib/chat/inbound";
import { asChatUpload, sendGuestReply } from "@/lib/chat/service";
import { getUser } from "@/lib/admin/users";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

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
  await pollInboundMailbox().catch(() => undefined);
  const item = await getApplication(id);
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function POST(
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
  const application = await getApplication(id);
  if (!application) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const form = await request.formData();
  const body = String(form.get("body") ?? "");
  const files = form
    .getAll("files")
    .map((item) => asChatUpload(item))
    .filter((item): item is NonNullable<ReturnType<typeof asChatUpload>> => Boolean(item));

  const user = await getUser(session.sub);

  try {
    const result = await sendGuestReply({
      application,
      authorId: session.sub,
      authorName: session.name,
      signature: user?.emailSignature ?? "",
      body,
      files,
    });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to send application chat message", error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: (error as Error).message || "Не удалось отправить сообщение" },
      { status },
    );
  }
}
