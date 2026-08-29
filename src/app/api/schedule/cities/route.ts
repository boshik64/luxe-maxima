import { NextResponse } from "next/server";
import { listCitiesWithCinemaCounts } from "@/lib/karo/cities";
import { CUSTOM_OPTION } from "@/lib/karo/types";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const cities = await listCitiesWithCinemaCounts();
    return NextResponse.json({
      items: [
        ...cities.map((city) => ({
          id: city.id,
          name: city.name,
          cinemaCount: city.cinemaCount,
          crestUrl: city.crestUrl,
        })),
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
