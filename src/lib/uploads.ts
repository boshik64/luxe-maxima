import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
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
const PUBLIC_DIR = path.join(process.cwd(), "public", "uploads", "banners");
const DATA_DIR = path.join(process.cwd(), "uploads", "banners");
const BANNER_DIRS = [DATA_DIR, PUBLIC_DIR];
export const MEDIA_PREFIX = "/api/media/banners/";
const LEGACY_PREFIX = "/uploads/banners/";

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

export function bannerFileName(imageUrl: string) {
  const name = path.basename((imageUrl.split("?")[0] ?? "").trim());
  if (!name || name === "." || name === ".." || name.includes("/") || name.includes("\\")) {
    return "";
  }
  return name;
}

export function bannerPublicUrl(imageUrl: string) {
  const name = bannerFileName(imageUrl);
  return name ? `${MEDIA_PREFIX}${name}` : imageUrl;
}

function mimeFor(name: string) {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function readBannerFile(imageUrl: string) {
  const name = bannerFileName(imageUrl);
  if (!name) return null;
  for (const dir of BANNER_DIRS) {
    try {
      const data = await readFile(path.join(dir, name));
      return { data, type: mimeFor(name) };
    } catch {
      // пробуем следующий каталог
    }
  }
  return null;
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
    const name = `${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(path.join(DATA_DIR, name), bytes);
    try {
      await mkdir(PUBLIC_DIR, { recursive: true });
      await writeFile(path.join(PUBLIC_DIR, name), bytes);
    } catch {
      // public/ может быть только для чтения — файл отдаём через /api/media
    }
    return `${MEDIA_PREFIX}${name}`;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EACCES" || code === "EPERM") {
      throw new CatalogError("Нет прав записать файл баннера на диск", 500);
    }
    throw new CatalogError("Не удалось сохранить файл баннера", 500);
  }
}

export async function removeBannerUpload(imageUrl: string) {
  if (!imageUrl.startsWith(MEDIA_PREFIX) && !imageUrl.startsWith(LEGACY_PREFIX)) {
    return;
  }
  const name = bannerFileName(imageUrl);
  if (!name) return;
  await Promise.all(
    BANNER_DIRS.map(async (dir) => {
      try {
        await unlink(path.join(dir, name));
      } catch {
        // файл мог уже отсутствовать
      }
    }),
  );
}
