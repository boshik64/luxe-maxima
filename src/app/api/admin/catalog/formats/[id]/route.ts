import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/admin/auth";
import {
  catalogErrorResponse,
  formFlag,
  optionalInt,
  parseBenefits,
} from "@/lib/catalog/http";
import {
  countShowcasePublished,
  deleteFormat,
  getFormat,
  updateFormat,
} from "@/lib/catalog/service";
import {
  asBannerUpload,
  bannerPublicUrl,
  removeBannerUpload,
  saveBannerUpload,
} from "@/lib/uploads";

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await context.params;
    const item = await getFormat(id);
    if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    const showcasePublishedCount = await countShowcasePublished();
    return NextResponse.json({
      item: withPublicImage(item),
      showcasePublishedCount,
    });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") ?? "";
    const current = await getFormat(id);
    if (!current) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    let patch: Parameters<typeof updateFormat>[1] = {};
    let uploaded: string | undefined;

    if (!contentType.includes("application/json")) {
      const form = await request.formData();
      const file = asBannerUpload(form.get("file"));
      uploaded = file ? await saveBannerUpload(file) : undefined;
      patch = {
        name: form.has("name") ? String(form.get("name") ?? "") : undefined,
        benefits: form.has("benefits")
          ? parseBenefits(String(form.get("benefits") ?? ""))
          : undefined,
        showcasePublished: form.has("showcasePublished")
          ? formFlag(form.get("showcasePublished"))
          : undefined,
        showcaseOrder: optionalInt(form.get("showcaseOrder"), "Очередность", 0),
        ...(uploaded ? { imageUrl: uploaded } : {}),
      };
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      patch = {
        name: typeof body.name === "string" ? body.name : undefined,
        benefits:
          body.benefits !== undefined ? parseBenefits(body.benefits) : undefined,
        imageUrl:
          body.imageUrl === null || typeof body.imageUrl === "string"
            ? (body.imageUrl as string | null)
            : undefined,
        enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
        showcasePublished:
          typeof body.showcasePublished === "boolean"
            ? body.showcasePublished
            : undefined,
        showcaseOrder: optionalInt(body.showcaseOrder, "Очередность", 0),
      };
    }

    const item = await updateFormat(id, patch);
    if (uploaded && current.imageUrl && current.imageUrl !== uploaded) {
      await removeBannerUpload(current.imageUrl);
    }
    revalidateHome();
    return NextResponse.json({ item: withPublicImage(item) });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["ADMIN"]);
    const { id } = await context.params;
    const current = await getFormat(id);
    await deleteFormat(id);
    if (current?.imageUrl) await removeBannerUpload(current.imageUrl);
    revalidateHome();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
