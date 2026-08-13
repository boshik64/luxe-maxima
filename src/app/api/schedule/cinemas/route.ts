import { NextRequest, NextResponse } from "next/server";
import { fetchCinemas } from "@/lib/karo/client";
import { CUSTOM_OPTION } from "@/lib/karo/types";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const cityId = Number(request.nextUrl.searchParams.get("cityId"));
  if (!Number.isFinite(cityId) || cityId <= 0) {
    return NextResponse.json({ error: "Некорректный город" }, { status: 400 });
  }

  try {
    const cinemas = await fetchCinemas(cityId);
    return NextResponse.json({
      items: [
        ...cinemas.map((cinema) => ({
          id: String(cinema.id),
          name: cinema.name,
          address: cinema.address,
        })),
        CUSTOM_OPTION,
      ],
    });
  } catch (error) {
    logger.error("Failed to load cinemas", error);
    return NextResponse.json(
      { error: "Не удалось загрузить кинотеатры" },
      { status: 502 },
    );
  }
}
