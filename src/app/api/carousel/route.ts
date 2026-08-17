import { NextResponse } from "next/server";
import { getPublicCarousel } from "@/lib/carousel/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
};

export async function GET() {
  const data = await getPublicCarousel();
  return NextResponse.json(data, { headers: NO_STORE });
}
