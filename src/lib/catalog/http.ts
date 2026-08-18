import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { CatalogError } from "@/lib/catalog/service";
import { logger } from "@/lib/logger";

export function catalogErrorResponse(error: unknown) {
  const status = (error as Error & { status?: number }).status;
  if (status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (status === 403) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (error instanceof CatalogError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      { error: "Такая запись уже есть" },
      { status: 409 },
    );
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return NextResponse.json(
      { error: "Выберите кинотеатр и формат из справочника" },
      { status: 400 },
    );
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error("Catalog validation failed", error);
    return NextResponse.json(
      { error: "Не удалось сохранить запись. Обновите страницу и попробуйте ещё раз." },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { error: "Не удалось обработать запрос к справочнику" },
    { status: 500 },
  );
}

export function parseBenefits(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}

export function requiredString(value: unknown, label: string) {
  const text = typeof value === "string" ? value : "";
  if (!text.trim()) {
    throw new CatalogError(`Укажите ${label}`);
  }
  return text.trim();
}

export function requiredInt(value: unknown, label: string, min = 1) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new CatalogError(`${label}: укажите целое число от ${min}`);
  }
  return parsed;
}

export function optionalInt(value: unknown, label: string, min = 0) {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredInt(value, label, min);
}

export function formFlag(value: FormDataEntryValue | null) {
  return String(value) === "true";
}
