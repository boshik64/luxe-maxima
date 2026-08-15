"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import { Field, inputClassName } from "@/components/form/Field";
import { KARO_SITE_URL } from "@/lib/contacts";

type BannerItem = {
  imageUrl: string;
  href: string | null;
  alt: string;
  enabled: boolean;
  updatedAt: string;
};

export function BannerEditor() {
  const router = useRouter();
  const [item, setItem] = useState<BannerItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [href, setHref] = useState(KARO_SITE_URL);
  const [alt, setAlt] = useState("Кинокрыша КАРО");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    return fetch("/api/admin/banners").then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as {
        item?: BannerItem | null;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить баннер");
        return;
      }
      const next = data.item ?? null;
      setItem(next);
      if (next) {
        setHref(next.href || KARO_SITE_URL);
        setAlt(next.alt || "Кинокрыша КАРО");
        setEnabled(next.enabled);
      }
    });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить баннер");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const body = new FormData();
    if (file) body.set("file", file);
    body.set("href", href);
    body.set("alt", alt);
    body.set("enabled", enabled ? "true" : "false");
    const response = await fetch("/api/admin/banners", {
      method: "POST",
      body,
    });
    const data = (await response.json()) as { item?: BannerItem; error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось сохранить баннер");
      return;
    }
    setItem(data.item ?? null);
    setFile(null);
    setNotice("Баннер сохранён и показан на главной, если включён.");
  }

  async function onDelete() {
    if (!item || !window.confirm("Убрать баннер с главной?")) return;
    setSaving(true);
    const response = await fetch("/api/admin/banners", { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить");
      return;
    }
    setItem(null);
    setFile(null);
    setNotice("Баннер снят");
  }

  const shown = objectUrl || (item ? `${item.imageUrl}?v=${item.updatedAt}` : "");

  return (
    <AdminPage
      title="Баннер на главной"
      description="Широкая картинка между героем и блоком «Услуги». Лучше горизонтальный макет, JPG или PNG до 8 МБ."
    >
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : (
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="grid max-w-4xl gap-6 rounded-3xl border border-line bg-card p-6 sm:p-8"
        >
          <Field id="banner-file" label="Изображение" required={!item}>
            <input
              id="banner-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Field>
          {shown ? (
            <div className="overflow-hidden rounded-2xl border border-line">
              {/* Предпросмотр загруженного файла */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shown} alt="" className="h-auto w-full" />
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              Пока нет файла — загрузите горизонтальный баннер.
            </p>
          )}
          <Field id="banner-href" label="Ссылка по клику">
            <input
              id="banner-href"
              className={inputClassName}
              value={href}
              placeholder={KARO_SITE_URL}
              onChange={(event) => setHref(event.target.value)}
            />
          </Field>
          <Field id="banner-alt" label="Подпись для скринридеров">
            <input
              id="banner-alt"
              className={inputClassName}
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
            />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            Показывать на главной
          </label>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          {notice ? <p className="text-sm text-gold">{notice}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Сохраняем…" : "Сохранить баннер"}
            </button>
            {item ? (
              <button
                type="button"
                disabled={saving}
                className="rounded-full border border-line px-5 py-3 text-sm text-primary"
                onClick={() => void onDelete()}
              >
                Удалить
              </button>
            ) : null}
          </div>
        </form>
      )}
    </AdminPage>
  );
}
