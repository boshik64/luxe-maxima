import { NextRequest, NextResponse } from "next/server";
import { listHalls } from "@/lib/karo/schedule";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const cinemaId = Number(request.nextUrl.searchParams.get("cinemaId"));
  if (!Number.isFinite(cinemaId) || cinemaId <= 0) {
    return NextResponse.json(
      { error: "Некорректный кинотеатр" },
      { status: 400 },
    );
  }

  try {
    const items = await listHalls(cinemaId);
    return NextResponse.json({ items });
  } catch (error) {
    logger.error("Failed to load halls", error);
    return NextResponse.json(
      { error: "Не удалось загрузить залы" },
      { status: 502 },
    );
  }
}
