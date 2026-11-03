import { NextRequest, NextResponse } from "next/server";
import { pollInboundMailbox } from "@/lib/chat/inbound";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (secret && token !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await pollInboundMailbox();
  return NextResponse.json(result);
}
