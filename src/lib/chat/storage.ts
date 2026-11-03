import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const CHAT_DIR = path.join(process.cwd(), "uploads", "chat");
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "docx",
  ],
  ["application/vnd.ms-excel", "xls"],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xlsx",
  ],
]);

export type ChatUpload = {
  name?: string;
  type?: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export function asChatUpload(value: FormDataEntryValue | null): ChatUpload | null {
  if (!value || typeof value === "string") return null;
  const file = value as ChatUpload;
  if (!file.size || typeof file.arrayBuffer !== "function") return null;
  return file;
}

function extensionOf(file: { name?: string; type?: string }) {
  const type = file.type?.toLowerCase().trim();
  if (type && ALLOWED.has(type)) return ALLOWED.get(type);
  const name = (file.name ?? "").toLowerCase();
  const ext = name.split(".").pop() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx", "xls", "xlsx"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return "bin";
}

export async function saveChatAttachment(file: ChatUpload, applicationId: string) {
  if (file.size > MAX_BYTES) {
    throw new Error("Файл больше 12 МБ");
  }
  const ext = extensionOf(file);
  const key = `${applicationId}/${randomUUID()}.${ext}`;
  const full = path.join(CHAT_DIR, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, Buffer.from(await file.arrayBuffer()));
  return {
    storageKey: key,
    fileName: file.name?.trim() || `file.${ext}`,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}

export async function saveChatBuffer(options: {
  applicationId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}) {
  if (options.bytes.length > MAX_BYTES) return null;
  const ext = extensionOf({ name: options.fileName, type: options.mimeType });
  const key = `${options.applicationId}/${randomUUID()}.${ext}`;
  const full = path.join(CHAT_DIR, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, options.bytes);
  return {
    storageKey: key,
    fileName: options.fileName || `file.${ext}`,
    mimeType: options.mimeType || "application/octet-stream",
    size: options.bytes.length,
  };
}

export async function readChatAttachment(storageKey: string) {
  const safe = storageKey.replace(/\\/g, "/");
  if (safe.includes("..") || safe.startsWith("/")) return null;
  try {
    const data = await readFile(path.join(CHAT_DIR, safe));
    return data;
  } catch {
    return null;
  }
}
