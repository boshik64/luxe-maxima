"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClassName } from "@/components/form/Field";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  CatalogBack,
  CatalogShell,
} from "@/components/admin/catalog/CatalogShell";
import type { CinemaItem, FormatItem, HallItem } from "@/lib/catalog/admin-types";

export function HallEditor({ id }: { id?: string }) {
  const router = useRouter();
  const isNew = !id;
  const [cinemas, setCinemas] = useState<CinemaItem[]>([]);
  const [formats, setFormats] = useState<FormatItem[]>([]);
  const [cinemaId, setCinemaId] = useState("");
  const [formatId, setFormatId] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [rentalPriceWeekday, setRentalPriceWeekday] = useState("");
  const [rentalPriceWeekend, setRentalPriceWeekend] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLookups = useCallback(() => {
    return Promise.all([
      fetch("/api/admin/catalog/cinemas"),
      fetch("/api/admin/catalog/formats"),
    ]).then(async ([cinemasRes, formatsRes]) => {
      if (cinemasRes.status === 401 || formatsRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      const cinemasData = (await cinemasRes.json()) as {
        items?: CinemaItem[];
        error?: string;
      };
      const formatsData = (await formatsRes.json()) as {
        items?: FormatItem[];
        error?: string;
      };
      if (!cinemasRes.ok || !formatsRes.ok) {
        setError(
          cinemasData.error ??
            formatsData.error ??
            "Не удалось загрузить кинотеатры и форматы",
        );
        return;
      }
      setCinemas(cinemasData.items ?? []);
      setFormats(formatsData.items ?? []);
    });
  }, [router]);

  const loadItem = useCallback(() => {
    if (!id) return Promise.resolve();
    return fetch(`/api/admin/catalog/halls/${id}`).then(async (response) => {
      const data = (await response.json()) as { item?: HallItem; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить зал");
        return;
      }
      const item = data.item;
      if (!item) {
        setError("Запись не найдена");
        return;
      }
      setCinemaId(item.cinemaId);
      setFormatId(item.formatId);
      setName(item.name);
      setCapacity(String(item.capacity));
      setRentalPriceWeekday(String(item.rentalPriceWeekday));
      setRentalPriceWeekend(String(item.rentalPriceWeekend));
    });
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadLookups(), loadItem()])
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить зал");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadItem, loadLookups]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const body = {
      cinemaId,
      formatId,
      name,
      capacity: Number(capacity),
      rentalPriceWeekday: Number(rentalPriceWeekday),
      rentalPriceWeekend: Number(rentalPriceWeekend),
    };
    const response = await fetch(
      isNew ? "/api/admin/catalog/halls" : `/api/admin/catalog/halls/${id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data = (await response.json()) as { item?: HallItem; error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    if (isNew && data.item) {
      router.push(`/admin/catalogs/halls/${data.item.id}`);
      return;
    }
    setNotice("Сохранено");
  }

  async function onDelete() {
    if (!id || !window.confirm("Удалить зал?")) return;
    setSaving(true);
    const response = await fetch(`/api/admin/catalog/halls/${id}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить");
      return;
    }
    router.push("/admin/catalogs/halls");
  }

  return (
    <CatalogShell
      title={isNew ? "Новый зал" : name || "Зал"}
      description="Вместимость и две стоимости аренды: будни и выходные. Их видит клиент на карточке зала."
    >
      <CatalogBack href="/admin/catalogs/halls" label="← К списку залов" />
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : (
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="grid max-w-3xl gap-5 rounded-3xl border border-line bg-card p-6 sm:p-8 sm:grid-cols-2"
        >
          <Field id="hall-cinema" label="Кинотеатр" required>
            <CustomSelect
              id="hall-cinema"
              value={cinemaId}
              placeholder="Выберите"
              options={cinemas.map((item) => ({
                value: item.id,
                label: `${item.cityName} — ${item.name}`,
              }))}
              onChange={setCinemaId}
            />
          </Field>
          <Field id="hall-format" label="Формат" required>
            <CustomSelect
              id="hall-format"
              value={formatId}
              placeholder="Выберите"
              options={formats.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={setFormatId}
            />
          </Field>
          <Field id="hall-name" label="Название зала" required>
            <input
              id="hall-name"
              className={inputClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field id="hall-capacity" label="Вместимость" required>
            <input
              id="hall-capacity"
              className={inputClassName}
              inputMode="numeric"
              value={capacity}
              onChange={(event) =>
                setCapacity(event.target.value.replace(/\D/g, ""))
              }
            />
          </Field>
          <Field id="hall-price-weekday" label="Стоимость пн–пт, ₽" required>
            <input
              id="hall-price-weekday"
              className={inputClassName}
              inputMode="numeric"
              value={rentalPriceWeekday}
              onChange={(event) =>
                setRentalPriceWeekday(event.target.value.replace(/\D/g, ""))
              }
            />
          </Field>
          <Field id="hall-price-weekend" label="Стоимость сб–вс, ₽" required>
            <input
              id="hall-price-weekend"
              className={inputClassName}
              inputMode="numeric"
              value={rentalPriceWeekend}
              onChange={(event) =>
                setRentalPriceWeekend(event.target.value.replace(/\D/g, ""))
              }
            />
          </Field>
          <div className="sm:col-span-2 space-y-3">
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
          </div>
        </form>
      )}
    </CatalogShell>
  );
}
