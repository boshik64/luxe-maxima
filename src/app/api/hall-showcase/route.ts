import { NextResponse } from "next/server";
import { listLandingHallShowcase } from "@/lib/catalog/showcase";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await listLandingHallShowcase();
  return NextResponse.json({ items });
}
