import { NextRequest, NextResponse } from "next/server";
import { ApplicationValidationError } from "@/lib/applications/errors";
import {
  applicationInputSchema,
  flattenErrors,
} from "@/lib/applications/schema";
import { createApplication } from "@/lib/applications/service";
import { captchaFromBody, verifyCaptcha } from "@/lib/captcha";
import { checkMailbox } from "@/lib/email/mailbox";
import { logger } from "@/lib/logger";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(`app:${ip}`)) {
    return NextResponse.json(
      { error: "Слишком много заявок. Попробуйте позже." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = applicationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы", fields: flattenErrors(parsed.error) },
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

  try {
    const result = await createApplication(parsed.data);
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    if (error instanceof ApplicationValidationError) {
      return NextResponse.json(
        { error: error.message, fields: error.fields },
        { status: 422 },
      );
    }
    logger.error("Application create failed", error);
    return NextResponse.json(
      { error: "Не удалось отправить заявку. Попробуйте ещё раз." },
      { status: 502 },
    );
  }
}

