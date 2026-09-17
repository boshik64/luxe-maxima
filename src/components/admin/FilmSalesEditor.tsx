"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import { Field, inputClassName } from "@/components/form/Field";
import type { FilmSaleMechanicItem } from "@/lib/films/sale-mechanics";

export function FilmSalesEditor() {
  const router = useRouter();
  const [items, setItems] = useState<FilmSaleMechanicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    return fetch("/api/admin/film-sales").then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as {
        items?: FilmSaleMechanicItem[];
        error?: string;
      };
      if (!response.ok || !data.items) {
        setError(data.error ?? "Не удалось загрузить механики продажи");
        return;
      }
      setItems(data.items);
      setError("");
    });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить механики продажи");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  function updateItem(
    saleId: number,
    patch: Partial<Pick<FilmSaleMechanicItem, "enabled" | "label">>,
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.saleId === saleId ? { ...item, ...patch } : item,
      ),
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/film-sales", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          saleId: item.saleId,
          enabled: item.enabled,
          label: item.label,
        })),
      }),
    });
    const data = (await response.json()) as {
      items?: FilmSaleMechanicItem[];
      error?: string;
    };
    setSaving(false);
    if (!response.ok || !data.items) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    setItems(data.items);
    setNotice("Сохранено. На лендинге останутся фильмы с включёнными механиками.");
  }

  return (
    <AdminPage
      title="Механики продажи"
      description="Выберите, какие sale_id из каталога КАРО показывать в формах выбора фильма на лендинге."
    >
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : (
        <form className="space-y-6" onSubmit={onSubmit}>
          {error ? (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
              {notice}
            </p>
          ) : null}

          {items.length === 0 ? (
            <p className="text-sm text-muted">
              В каталоге КАРО пока нет фильмов с sale_id.
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.saleId}
                  className="rounded-2xl border border-line bg-surface px-5 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={item.enabled}
                        onChange={(event) =>
                          updateItem(item.saleId, {
                            enabled: event.target.checked,
                          })
                        }
                      />
                      <span>
                        <span className="block font-medium">
                          sale_id {item.saleId}
                          {item.label ? ` — ${item.label}` : ""}
                        </span>
                        <span className="mt-1 block text-sm text-muted">
                          {item.filmCount} фильм(ов) в каталоге
                          {item.sampleTitles.length
                            ? `: ${item.sampleTitles.join(", ")}`
                            : ""}
                        </span>
                      </span>
                    </label>
                    <div className="w-full max-w-xs">
                      <Field label="Подпись в админке">
                        <input
                          className={inputClassName}
                          value={item.label}
                          placeholder={`Механика ${item.saleId}`}
                          onChange={(event) =>
                            updateItem(item.saleId, {
                              label: event.target.value,
                            })
                          }
                        />
                      </Field>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={saving || items.length === 0}
            className="rounded-full bg-primary px-5 py-2.5 text-sm text-white disabled:opacity-60"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </form>
      )}
    </AdminPage>
  );
}
