import { NextResponse } from "next/server";
import { getPublicEventPromo } from "@/lib/events/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const item = await getPublicEventPromo();
  return NextResponse.json(
    { item },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    },
  );
}
