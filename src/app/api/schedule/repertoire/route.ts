import { NextRequest, NextResponse } from "next/server";
import { searchRepertoire } from "@/lib/karo/schedule";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  try {
    const items = await searchRepertoire(query);
    return NextResponse.json({ items });
  } catch (error) {
    logger.error("Failed to load repertoire", error);
    return NextResponse.json(
      { error: "Не удалось загрузить репертуар" },
      { status: 502 },
    );
  }
}
