import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import {
  catalogErrorResponse,
  formFlag,
  optionalInt,
  parseBenefits,
  requiredString,
} from "@/lib/catalog/http";
import {
  countShowcasePublished,
  createFormat,
  listFormats,
} from "@/lib/catalog/service";
import { asBannerUpload, bannerPublicUrl, saveBannerUpload } from "@/lib/uploads";

export const runtime = "nodejs";

function withPublicImage<T extends { imageUrl: string | null }>(item: T) {
  return {
    ...item,
    imageUrl: item.imageUrl ? bannerPublicUrl(item.imageUrl) : null,
  };
}

function revalidateHome() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
  } catch {
    // страница обновится при следующем запросе
  }
}

export async function GET() {
  try {
    await requireSession();
    const [items, showcasePublishedCount] = await Promise.all([
      listFormats(),
      countShowcasePublished(),
    ]);
    return NextResponse.json({
      items: items.map(withPublicImage),
      showcasePublishedCount,
    });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const contentType = request.headers.get("content-type") ?? "";
    let payload: Parameters<typeof createFormat>[0];

    if (!contentType.includes("application/json")) {
      const form = await request.formData();
      const file = asBannerUpload(form.get("file"));
      const imageUrl = file ? await saveBannerUpload(file) : null;
      payload = {
        name: requiredString(form.get("name"), "название формата"),
        benefits: parseBenefits(String(form.get("benefits") ?? "")),
        imageUrl,
        showcasePublished: formFlag(form.get("showcasePublished")),
        showcaseOrder: optionalInt(form.get("showcaseOrder"), "Очередность", 0) ?? 0,
      };
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      payload = {
        name: requiredString(body.name, "название формата"),
        benefits: parseBenefits(body.benefits),
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : null,
      };
    }

    const item = await createFormat(payload);
    revalidateHome();
    return NextResponse.json({ item: withPublicImage(item) }, { status: 201 });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
