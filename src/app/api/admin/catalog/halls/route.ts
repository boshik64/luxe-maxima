import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import {
  catalogErrorResponse,
  requiredInt,
  requiredString,
} from "@/lib/catalog/http";
import { createHall, listHalls } from "@/lib/catalog/service";

export async function GET() {
  try {
    await requireSession();
    const items = await listHalls();
    return NextResponse.json({ items });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const item = await createHall({
      cinemaId: requiredString(body.cinemaId, "кинотеатр"),
      formatId: requiredString(body.formatId, "формат зала"),
      name: requiredString(body.name, "название зала"),
      capacity: requiredInt(body.capacity, "Вместимость"),
      rentalPrice: requiredInt(body.rentalPrice, "Стоимость аренды", 0),
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
