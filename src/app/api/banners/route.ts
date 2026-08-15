import { NextRequest, NextResponse } from "next/server";
import { getPublicBanner, HOME_BANNER_SLOT } from "@/lib/banner/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const slot = request.nextUrl.searchParams.get("slot")?.trim() || HOME_BANNER_SLOT;
  const item = await getPublicBanner(slot);
  return NextResponse.json({ item });
}
