import { NextResponse } from "next/server";
import { ADMIN_COOKIE, cookieSecure } from "@/lib/admin/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    secure: cookieSecure(),
  });
  return response;
}
