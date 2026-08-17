import { NextRequest, NextResponse } from "next/server";
import { getPublicBanner, parseBannerSlot } from "@/lib/banner/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0, must-revalidate" };

export async function GET(request: NextRequest) {
  const slot = parseBannerSlot(request.nextUrl.searchParams.get("slot"));
  const item = await getPublicBanner(slot);
  return NextResponse.json({ item }, { headers: NO_STORE });
}
