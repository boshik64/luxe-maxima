import { NextRequest, NextResponse } from "next/server";
import { captchaFromBody, verifyCaptcha } from "@/lib/captcha";
import { checkMailbox } from "@/lib/email/mailbox";
import { feedbackInputSchema, flattenFeedbackErrors } from "@/lib/feedback/schema";
import { createFeedback } from "@/lib/feedback/service";
import { logger } from "@/lib/logger";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(`feedback:${ip}`, 6, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Слишком много сообщений. Попробуйте позже." },
        { status: 429 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const parsed = feedbackInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Проверьте поля формы", fields: flattenFeedbackErrors(parsed.error) },
        { status: 422 },
      );
    }

    if (parsed.data.website) {
      return NextResponse.json({ id: parsed.data.idempotencyKey });
    }

    const captcha = captchaFromBody(body);
    const captchaCheck = verifyCaptcha(captcha.token, captcha.proof);
    if (!captchaCheck.ok) {
      return NextResponse.json(
        { error: captchaCheck.message, fields: { captcha: captchaCheck.message } },
        { status: 422 },
      );
    }

    const mailboxError = await checkMailbox(parsed.data.email);
    if (mailboxError) {
      return NextResponse.json(
        { error: mailboxError, fields: { email: mailboxError } },
        { status: 422 },
      );
    }

    const result = await createFeedback(parsed.data);
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    logger.error("Feedback create failed", error);
    return NextResponse.json(
      { error: "Не удалось отправить сообщение. Попробуйте ещё раз." },
      { status: 502 },
    );
  }
}
