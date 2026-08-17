import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import { CatalogError } from "@/lib/catalog/service";
import {
  CAROUSEL_IMAGE_SPEC,
  carouselHttpError,
  createCarouselSlide,
  getCarouselSettings,
  listCarouselSlides,
  parseCarouselLayout,
  setCarouselInterval,
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
    "Не удалось сохранить карусель",
  );
  return NextResponse.json({ error: message }, { status });
}

function serializeSlide(item: {
  id: string;
  kicker: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  alt: string;
  layout: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt: Date;
}) {
  return {
    ...item,
    imageUrl: bannerPublicUrl(item.imageUrl),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function revalidateHome() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
  } catch (error) {
    logger.error("Carousel revalidate failed", error);
  }
}

export async function GET() {
  try {
    await requireSession();
    const [settings, items] = await Promise.all([
      getCarouselSettings(),
      listCarouselSlides(true),
    ]);
    return NextResponse.json({
      intervalSeconds: settings.intervalSeconds,
      imageSpec: CAROUSEL_IMAGE_SPEC,
      items: items.map(serializeSlide),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new CatalogError("Не удалось прочитать файл. Попробуйте JPG или PNG до 8 МБ.");
    }
    const file = asUpload(form.get("file"));
    if (!file) throw new CatalogError("Загрузите изображение поста");

    const imageUrl = await saveBannerUpload(file);
    const item = await createCarouselSlide({
      imageUrl,
      kicker: String(form.get("kicker") ?? ""),
      title: String(form.get("title") ?? ""),
      body: String(form.get("body") ?? ""),
      ctaLabel: String(form.get("ctaLabel") ?? ""),
      ctaHref: String(form.get("ctaHref") ?? "#form"),
      alt: String(form.get("alt") ?? ""),
      layout: parseCarouselLayout(String(form.get("layout") ?? "")),
      enabled: String(form.get("enabled")) === "true",
    });
    revalidateHome();
    return NextResponse.json({ item: serializeSlide(item) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireSession();
    const body = (await request.json()) as { intervalSeconds?: number };
    const settings = await setCarouselInterval(Number(body.intervalSeconds));
    revalidateHome();
    return NextResponse.json({ intervalSeconds: settings.intervalSeconds });
  } catch (error) {
    return errorResponse(error);
  }
}
