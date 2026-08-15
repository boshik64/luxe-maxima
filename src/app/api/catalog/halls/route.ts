import { NextRequest, NextResponse } from "next/server";
import { catalogErrorResponse } from "@/lib/catalog/http";
import { listPublicHalls } from "@/lib/catalog/service";

export async function GET(request: NextRequest) {
  try {
    const cinemaId = request.nextUrl.searchParams.get("cinemaId")?.trim() ?? "";
    const formatId = request.nextUrl.searchParams.get("formatId")?.trim() ?? "";
    if (!cinemaId || !formatId) {
      return NextResponse.json(
        { error: "Укажите кинотеатр и формат зала" },
        { status: 400 },
      );
    }

    const items = await listPublicHalls(cinemaId, formatId);
    return NextResponse.json({ items });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
