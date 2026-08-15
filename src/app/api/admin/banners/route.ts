import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import {
  clearBanner,
  getBanner,
  HOME_BANNER_SLOT,
  upsertBanner,
} from "@/lib/banner/service";
import { CatalogError } from "@/lib/catalog/service";
import { KARO_SITE_URL } from "@/lib/contacts";
import { logger } from "@/lib/logger";
import { bannerPublicUrl, saveBannerUpload, type BannerUpload } from "@/lib/uploads";

export const runtime = "nodejs";

function parseHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return KARO_SITE_URL;
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    // fall through
  }
  throw new CatalogError("Ссылка должна начинаться с http:// или https://");
}

function asUpload(value: FormDataEntryValue | null): BannerUpload | null {
  if (!value || typeof value === "string") return null;
  const file = value as BannerUpload;
  if (typeof file.arrayBuffer !== "function" || !file.size) return null;
  return file;
}

function bannerErrorResponse(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  if (status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof CatalogError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  logger.error("Banner request failed", error);
  const code = (error as { code?: string }).code;
  if (code === "P2021") {
    return NextResponse.json(
      {
        error:
          "Таблица баннера не найдена. Выполните npx prisma migrate deploy и перезапустите сервер.",
      },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { error: "Не удалось сохранить баннер" },
    { status: 500 },
  );
}

export async function GET() {
  try {
    await requireSession();
    const item = await getBanner(HOME_BANNER_SLOT);
    return NextResponse.json({
      item: item ? { ...item, imageUrl: bannerPublicUrl(item.imageUrl) } : null,
    });
  } catch (error) {
    return bannerErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const form = await request.formData();
    const file = asUpload(form.get("file"));
    const hrefRaw = String(form.get("href") ?? "").trim();
    const alt = String(form.get("alt") ?? "").trim();
    const enabled = String(form.get("enabled") ?? "true") !== "false";
    const current = await getBanner(HOME_BANNER_SLOT);

    let imageUrl = current?.imageUrl ?? "";
    if (file) {
      imageUrl = await saveBannerUpload(file);
    }
    if (!imageUrl) {
      throw new CatalogError("Загрузите изображение баннера");
    }

    const href = parseHref(hrefRaw);
    const item = await upsertBanner({
      imageUrl,
      href,
      alt: alt || "Баннер КАРО",
      enabled,
    });
    return NextResponse.json({
      item: { ...item, imageUrl: bannerPublicUrl(item.imageUrl) },
    });
  } catch (error) {
    return bannerErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    await requireSession();
    await clearBanner(HOME_BANNER_SLOT);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return bannerErrorResponse(error);
  }
}
