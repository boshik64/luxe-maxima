import { NextResponse } from "next/server";
import { readBannerFile } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  const stored = await readBannerFile(file);
  if (!stored) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": stored.type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
