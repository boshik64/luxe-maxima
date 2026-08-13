import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  COOKIE_MAX_AGE,
  authenticate,
  createSessionToken,
} from "@/lib/admin/auth";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`admin:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Слишком много попыток" }, { status: 429 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Укажите email и пароль" }, { status: 400 });
  }

  try {
    const user = await authenticate(body.email, body.password);
    if (!user) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    const response = NextResponse.json({
      ok: true,
      role: user.role,
      name: user.name,
    });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Админка недоступна: проверьте подключение к базе" },
      { status: 503 },
    );
  }
}
