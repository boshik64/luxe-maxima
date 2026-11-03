import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { readChatAttachment } from "@/lib/chat/storage";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, fileId } = await context.params;
  const file = await prisma.applicationAttachment.findFirst({
    where: { id: fileId, message: { applicationId: id } },
  });
  if (!file) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  const data = await readChatAttachment(file.storageKey);
  if (!data) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    },
  });
}
