import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { CatalogError } from "@/lib/catalog/service";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/pjpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export const MAX_BANNER_BYTES = 8 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "banners");
const PUBLIC_PREFIX = "/uploads/banners/";

export type BannerUpload = {
  name?: string;
  type?: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function extensionOf(file: BannerUpload) {
  const type = file.type?.toLowerCase().trim();
  if (type && ALLOWED.has(type)) return ALLOWED.get(type);
  const name = (file.name ?? "").toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".gif")) return "gif";
  return undefined;
}

export async function saveBannerUpload(file: BannerUpload) {
  const ext = extensionOf(file);
  if (!ext) {
    throw new CatalogError("Загрузите изображение JPG, PNG, WEBP или GIF");
  }
  if (file.size > MAX_BANNER_BYTES) {
    throw new CatalogError("Файл больше 8 МБ");
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(
      path.join(UPLOAD_DIR, name),
      Buffer.from(await file.arrayBuffer()),
    );
    return `${PUBLIC_PREFIX}${name}`;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EACCES" || code === "EPERM") {
      throw new CatalogError("Нет прав записать файл баннера на диск", 500);
    }
    throw new CatalogError("Не удалось сохранить файл баннера", 500);
  }
}

export async function removeBannerUpload(imageUrl: string) {
  if (!imageUrl.startsWith(PUBLIC_PREFIX)) return;
  const name = path.basename(imageUrl.split("?")[0] ?? "");
  if (!name || name === "." || name === "..") return;
  try {
    await unlink(path.join(UPLOAD_DIR, name));
  } catch {
    // файл мог уже отсутствовать
  }
}
