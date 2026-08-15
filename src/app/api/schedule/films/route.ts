import { NextRequest, NextResponse } from "next/server";
import { listFilms } from "@/lib/karo/schedule";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const cinemaId = Number(request.nextUrl.searchParams.get("cinemaId"));
  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (!Number.isFinite(cinemaId) || cinemaId <= 0) {
    return NextResponse.json(
      { error: "Некорректный кинотеатр" },
      { status: 400 },
    );
  }

  try {
    const items = await listFilms(cinemaId, query);
    return NextResponse.json({ items });
  } catch (error) {
    logger.error("Failed to load films", error);
    return NextResponse.json(
      { error: "Не удалось загрузить фильмы. Можно указать свой вариант." },
      { status: 502 },
    );
  }
}
