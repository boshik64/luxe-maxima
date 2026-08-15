import { NextResponse } from "next/server";
import { issueCaptcha, solveIssuedCaptcha } from "@/lib/captcha";
import { isRateLimited } from "@/lib/rate-limit";

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
      { status: 429 },
    );
  }

  return NextResponse.json(issueCaptcha());
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isRateLimited(`captcha-solve:${ip}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите немного." },
      { status: 429 },
    );
  }

  let token = "";
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token : "";
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const proof = solveIssuedCaptcha(token);
  if (!proof) {
    return NextResponse.json(
      { error: "Капча устарела. Оторвите корешок ещё раз." },
      { status: 400 },
    );
  }

  return NextResponse.json({ proof });
}
