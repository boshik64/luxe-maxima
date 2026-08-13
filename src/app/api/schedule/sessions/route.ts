import { NextRequest, NextResponse } from "next/server";
import { listSessions } from "@/lib/karo/schedule";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const cinemaId = Number(request.nextUrl.searchParams.get("cinemaId"));
  const hallId = request.nextUrl.searchParams.get("hallId") ?? undefined;
  const filmId = request.nextUrl.searchParams.get("filmId") ?? undefined;
  if (!Number.isFinite(cinemaId) || cinemaId <= 0) {
    return NextResponse.json(
      { error: "Некорректные параметры сеансов" },
      { status: 400 },
    );
  }

  try {
    const items = await listSessions(cinemaId, { hallId, filmId });
    return NextResponse.json({ items });
  } catch (error) {
    logger.error("Failed to load sessions", error);
    return NextResponse.json(
      { error: "Не удалось загрузить сеансы. Можно указать своё время." },
      { status: 502 },
    );
  }
}
