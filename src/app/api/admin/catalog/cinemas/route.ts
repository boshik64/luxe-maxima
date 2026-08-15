import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import {
  catalogErrorResponse,
  requiredString,
} from "@/lib/catalog/http";
import { createCinema, listCinemas } from "@/lib/catalog/service";

export async function GET() {
  try {
    await requireSession();
    const items = await listCinemas();
    return NextResponse.json({ items });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const item = await createCinema({
      karoCinemaId: requiredString(body.karoCinemaId, "кинотеатр КАРО"),
      name: requiredString(body.name, "название"),
      cityId: requiredString(body.cityId, "город"),
      cityName: requiredString(body.cityName, "название города"),
      address: typeof body.address === "string" ? body.address : null,
      enabled: typeof body.enabled === "boolean" ? body.enabled : true,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
