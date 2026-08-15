import { NextRequest, NextResponse } from "next/server";
import { catalogErrorResponse } from "@/lib/catalog/http";
import { listPublicFormats } from "@/lib/catalog/service";

export async function GET(request: NextRequest) {
  try {
    const cinemaId = request.nextUrl.searchParams.get("cinemaId")?.trim() ?? "";
    if (!cinemaId) {
      return NextResponse.json(
        { error: "Некорректный кинотеатр" },
        { status: 400 },
      );
    }

    const items = await listPublicFormats(cinemaId);
    return NextResponse.json({ items });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
