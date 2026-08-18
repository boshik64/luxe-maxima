"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClassName } from "@/components/form/Field";
import {
  CatalogBack,
  CatalogShell,
} from "@/components/admin/catalog/CatalogShell";
import {
  FORMAT_SHOWCASE_MAX,
  type FormatItem,
} from "@/lib/catalog/admin-types";

export function FormatEditor({ id }: { id?: string }) {
  const router = useRouter();
  const isNew = !id;
  const [name, setName] = useState("");
  const [benefits, setBenefits] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showcasePublished, setShowcasePublished] = useState(false);
  const [showcaseOrder, setShowcaseOrder] = useState("0");
  const [publishedCount, setPublishedCount] = useState(0);
  const [hallsCount, setHallsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    if (!id) {
      return fetch("/api/admin/catalog/formats").then(async (response) => {
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = (await response.json()) as {
          showcasePublishedCount?: number;
        };
        if (response.ok) setPublishedCount(data.showcasePublishedCount ?? 0);
      });
    }
    return fetch(`/api/admin/catalog/formats/${id}`).then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as {
        item?: FormatItem;
        showcasePublishedCount?: number;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Запись не найдена");
        return;
      }
      const item = data.item;
      if (!item) {
        setError("Запись не найдена");
        return;
      }
      setName(item.name);
      setBenefits(item.benefits.join("\n"));
      setImageUrl(item.imageUrl);
      setShowcasePublished(item.showcasePublished);
      setShowcaseOrder(String(item.showcaseOrder ?? 0));
      setHallsCount(item._count.halls);
      setPublishedCount(data.showcasePublishedCount ?? 0);
    });
  }, [id, router]);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить формат");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = previewUrl || imageUrl || "";
  const othersPublished = showcasePublished
    ? Math.max(0, publishedCount - 1)
    : publishedCount;
  const slotsFull = othersPublished >= FORMAT_SHOWCASE_MAX;
  const hasImage = Boolean(shown);
  const canPublish = hasImage && (!slotsFull || showcasePublished);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const form = new FormData();
    form.append("name", name);
    form.append("benefits", benefits);
    form.append("showcasePublished", showcasePublished ? "true" : "false");
    form.append("showcaseOrder", showcaseOrder || "0");
    if (file) form.append("file", file);
    const response = await fetch(
      isNew ? "/api/admin/catalog/formats" : `/api/admin/catalog/formats/${id}`,
      {
        method: isNew ? "POST" : "PATCH",
        body: form,
      },
    );
    const data = (await response.json()) as { item?: FormatItem; error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    if (isNew && data.item) {
      router.push(`/admin/catalogs/formats/${data.item.id}`);
      return;
    }
    if (data.item) {
      setImageUrl(data.item.imageUrl);
      setShowcasePublished(data.item.showcasePublished);
      setShowcaseOrder(String(data.item.showcaseOrder ?? 0));
      setFile(null);
      setPublishedCount((count) => {
        const wasPublished = showcasePublished;
        const nowPublished = data.item!.showcasePublished;
        if (wasPublished === nowPublished) return count;
        return nowPublished ? count + 1 : Math.max(0, count - 1);
      });
    }
    setNotice("Сохранено");
  }

  async function onDelete() {
    if (!id || !window.confirm("Удалить формат?")) return;
    setSaving(true);
    const response = await fetch(`/api/admin/catalog/formats/${id}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить");
      return;
    }
    router.push("/admin/catalogs/formats");
  }

  return (
    <CatalogShell
      title={isNew ? "Новый формат зала" : name || "Формат зала"}
      description={
        isNew
          ? "Картинка формата может попасть на главную: не больше трёх опубликованных."
          : `Привязано залов: ${hallsCount}. Картинка на главной — не больше трёх форматов.`
      }
    >
      <CatalogBack href="/admin/catalogs/formats" label="← К списку форматов" />
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : (
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="grid max-w-3xl gap-5 rounded-3xl border border-line bg-card p-6 sm:p-8"
        >
          <Field id="format-name" label="Название формата" required>
            <input
              id="format-name"
              className={inputClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field id="format-image" label="Фото формата">
            <input
              id="format-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="mt-2 text-xs text-muted">
              JPG, PNG, WEBP или GIF до 8 МБ. На главной кадр обрежется под 4:3.
            </p>
          </Field>
          {shown ? (
            <div className="overflow-hidden rounded-2xl border border-line">
              {/* Предпросмотр кадра формата */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shown}
                alt=""
                className="aspect-[4/3] w-full max-w-md object-cover"
              />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              Загрузите кадр — на главной он обрежется под 4:3.
            </p>
          )}
          <Field id="format-order" label="Очередность на главной">
            <input
              id="format-order"
              className={inputClassName}
              inputMode="numeric"
              value={showcaseOrder}
              onChange={(event) =>
                setShowcaseOrder(event.target.value.replace(/\D/g, ""))
              }
            />
            <p className="mt-2 text-xs text-muted">
              Чем меньше число, тем левее картинка. На главной показываются
              только {FORMAT_SHOWCASE_MAX} опубликованные.
            </p>
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving || (!canPublish && !showcasePublished)}
              className="rounded-full border border-line px-5 py-3 text-sm disabled:opacity-60"
              onClick={() => {
                if (!showcasePublished && !canPublish) return;
                if (!showcasePublished && !hasImage) {
                  setError("Сначала загрузите картинку формата");
                  return;
                }
                setShowcasePublished((value) => !value);
              }}
            >
              {showcasePublished
                ? "Убрать картинку с главной"
                : "Показать картинку на главной"}
            </button>
            {slotsFull && !showcasePublished ? (
              <p className="text-sm text-muted">
                Уже заняты {FORMAT_SHOWCASE_MAX} места. Снимите публикацию с
                другого формата.
              </p>
            ) : null}
          </div>
          <Field id="format-benefits" label="Преимущества (по одному в строке)">
            <textarea
              id="format-benefits"
              className={`${inputClassName} min-h-36`}
              value={benefits}
              onChange={(event) => setBenefits(event.target.value)}
            />
          </Field>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          {notice ? <p className="text-sm text-gold">{notice}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Сохраняем…" : isNew ? "Создать" : "Сохранить"}
            </button>
            {isNew ? null : (
              <button
                type="button"
                disabled={saving}
                className="rounded-full border border-line px-5 py-3 text-sm text-primary"
                onClick={() => void onDelete()}
              >
                Удалить
              </button>
            )}
          </div>
        </form>
      )}
    </CatalogShell>
  );
}
