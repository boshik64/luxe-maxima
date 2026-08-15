import { NextResponse } from "next/server";
import { issueCaptcha } from "@/lib/captcha";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(`captcha:${ip}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите немного." },
      { status: 429 },
    );
  }

  return NextResponse.json(issueCaptcha());
}
