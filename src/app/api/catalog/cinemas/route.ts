import { NextRequest, NextResponse } from "next/server";
import { catalogErrorResponse } from "@/lib/catalog/http";
import { listPublicCinemas } from "@/lib/catalog/service";

export async function GET(request: NextRequest) {
  try {
    const cityId = request.nextUrl.searchParams.get("cityId")?.trim() ?? "";
    if (!cityId) {
      return NextResponse.json({ error: "Некорректный город" }, { status: 400 });
    }

    const items = await listPublicCinemas(cityId);
    return NextResponse.json({ items });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
