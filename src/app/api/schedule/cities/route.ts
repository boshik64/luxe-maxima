import { NextResponse } from "next/server";
import { fetchCities } from "@/lib/karo/client";
import { CUSTOM_OPTION } from "@/lib/karo/types";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const cities = await fetchCities();
    return NextResponse.json({
      items: [
        ...cities.map((city) => ({ id: String(city.id), name: city.name })),
        CUSTOM_OPTION,
      ],
    });
  } catch (error) {
    logger.error("Failed to load cities", error);
    return NextResponse.json(
      { error: "Не удалось загрузить города" },
      { status: 502 },
    );
  }
}
