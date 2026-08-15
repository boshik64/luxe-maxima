import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import {
  catalogErrorResponse,
  parseBenefits,
  requiredString,
} from "@/lib/catalog/http";
import { createFormat, listFormats } from "@/lib/catalog/service";

export async function GET() {
  try {
    await requireSession();
    const items = await listFormats();
    return NextResponse.json({ items });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const item = await createFormat({
      name: requiredString(body.name, "название формата"),
      benefits: parseBenefits(body.benefits),
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : null,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
