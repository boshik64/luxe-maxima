import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import { CatalogError } from "@/lib/catalog/service";
import {
  carouselHttpError,
  deleteCarouselSlide,
  parseCarouselLayout,
  updateCarouselSlide,
} from "@/lib/carousel/service";
import { logger } from "@/lib/logger";
import { bannerPublicUrl, saveBannerUpload, type BannerUpload } from "@/lib/uploads";

export const runtime = "nodejs";

function asUpload(value: FormDataEntryValue | null): BannerUpload | null {
  if (!value || typeof value === "string") return null;
  const file = value as BannerUpload & { bytes?: () => Promise<Uint8Array> };
  const size = Number(file.size ?? 0);
  if (!size) return null;
  if (typeof file.arrayBuffer === "function") return file;
  if (typeof file.bytes === "function") {
    return {
      name: file.name,
      type: file.type,
      size,
      arrayBuffer: async () => {
        const bytes = await file.bytes!();
        return bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ) as ArrayBuffer;
      },
    };
  }
  return null;
}

function errorResponse(error: unknown) {
  const { error: message, status } = carouselHttpError(
    error,
    "Не удалось сохранить пост",
  );
  return NextResponse.json({ error: message }, { status });
}

function revalidateHome() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
  } catch (error) {
    logger.error("Carousel revalidate failed", error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await context.params;
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new CatalogError("Не удалось прочитать файл. Попробуйте JPG или PNG до 8 МБ.");
    }
    const file = asUpload(form.get("file"));
    const imageUrl = file ? await saveBannerUpload(file) : undefined;
    const item = await updateCarouselSlide(id, {
      ...(form.has("kicker") ? { kicker: String(form.get("kicker") ?? "") } : {}),
      ...(form.has("title") ? { title: String(form.get("title") ?? "") } : {}),
      ...(form.has("body") ? { body: String(form.get("body") ?? "") } : {}),
      ...(form.has("ctaLabel") ? { ctaLabel: String(form.get("ctaLabel") ?? "") } : {}),
      ...(form.has("ctaHref") ? { ctaHref: String(form.get("ctaHref") ?? "") } : {}),
      ...(form.has("alt") ? { alt: String(form.get("alt") ?? "") } : {}),
      ...(form.has("layout")
        ? { layout: parseCarouselLayout(String(form.get("layout") ?? "")) }
        : {}),
      ...(form.has("enabled")
        ? { enabled: String(form.get("enabled")) === "true" }
        : {}),
      ...(imageUrl ? { imageUrl } : {}),
    });
    revalidateHome();
    return NextResponse.json({
      item: { ...item, imageUrl: bannerPublicUrl(item.imageUrl) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await context.params;
    await deleteCarouselSlide(id);
    revalidateHome();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
