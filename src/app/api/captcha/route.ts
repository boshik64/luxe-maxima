import { NextResponse } from "next/server";
import { issueCaptcha, solveIssuedCaptcha } from "@/lib/captcha";
import { isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0, must-revalidate" };

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(request: Request) {
  const ip = clientIp(request);
  if (isRateLimited(`captcha:${ip}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите немного." },
      { status: 429, headers: NO_STORE },
    );
  }

  return NextResponse.json(issueCaptcha(), { headers: NO_STORE });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isRateLimited(`captcha-solve:${ip}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите немного." },
      { status: 429, headers: NO_STORE },
    );
  }

  let token = "";
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token : "";
  } catch {
    return NextResponse.json(
      { error: "Некорректный запрос" },
      { status: 400, headers: NO_STORE },
    );
  }

  const proof = solveIssuedCaptcha(token);
  if (!proof) {
    return NextResponse.json(
      { error: "Капча устарела. Оторвите корешок ещё раз." },
      { status: 400, headers: NO_STORE },
    );
  }

  return NextResponse.json({ proof }, { headers: NO_STORE });
}
