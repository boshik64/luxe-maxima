"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClassName } from "@/components/form/Field";
import {
  CatalogBack,
  CatalogShell,
} from "@/components/admin/catalog/CatalogShell";
import type { FormatItem } from "@/lib/catalog/admin-types";

export function FormatEditor({ id }: { id?: string }) {
  const router = useRouter();
  const isNew = !id;
  const [name, setName] = useState("");
  const [benefits, setBenefits] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [hallsCount, setHallsCount] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    if (!id) return Promise.resolve();
    return fetch(`/api/admin/catalog/formats/${id}`).then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!response.ok) {
        setError("Запись не найдена");
        return;
      }
      const data = (await response.json()) as { item?: FormatItem };
      const item = data.item;
      if (!item) {
        setError("Запись не найдена");
        return;
      }
      setName(item.name);
      setBenefits(item.benefits.join("\n"));
      setImageUrl(item.imageUrl ?? "");
      setHallsCount(item._count.halls);
    });
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
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
  }, [id, load]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const response = await fetch(
      isNew ? "/api/admin/catalog/formats" : `/api/admin/catalog/formats/${id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, benefits, imageUrl }),
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
          ? "Создайте формат — его можно будет выбрать у залов."
          : `Привязано залов: ${hallsCount}`
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
          <Field id="format-image" label="Изображение (URL)">
            <input
              id="format-image"
              className={inputClassName}
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
            />
          </Field>
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
