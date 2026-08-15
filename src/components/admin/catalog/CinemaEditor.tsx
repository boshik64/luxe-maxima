"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClassName } from "@/components/form/Field";
import {
  CatalogBack,
  CatalogShell,
} from "@/components/admin/catalog/CatalogShell";
import type { CinemaItem } from "@/lib/catalog/admin-types";
import { CUSTOM_OPTION_ID, type ScheduleOption } from "@/lib/karo/types";

export function CinemaEditor({ id }: { id?: string }) {
  const router = useRouter();
  const isNew = !id;
  const [cities, setCities] = useState<ScheduleOption[]>([]);
  const [karoCinemas, setKaroCinemas] = useState<ScheduleOption[]>([]);
  const [cityId, setCityId] = useState("");
  const [karoCinemaId, setKaroCinemaId] = useState("");
  const [name, setName] = useState("");
  const [cityName, setCityName] = useState("");
  const [address, setAddress] = useState("");
  const [hallsCount, setHallsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCities = useCallback(() => {
    return fetch("/api/schedule/cities")
      .then((response) => response.json())
      .then((data: { items?: ScheduleOption[] }) => {
        setCities(
          (data.items ?? []).filter((item) => item.id !== CUSTOM_OPTION_ID),
        );
      });
  }, []);

  const loadItem = useCallback(() => {
    if (!id) return Promise.resolve();
    return fetch(`/api/admin/catalog/cinemas/${id}`).then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!response.ok) {
        setError("Запись не найдена");
        return;
      }
      const data = (await response.json()) as { item?: CinemaItem };
      const item = data.item;
      if (!item) {
        setError("Запись не найдена");
        return;
      }
      setName(item.name);
      setCityId(item.cityId);
      setCityName(item.cityName);
      setAddress(item.address ?? "");
      setHallsCount(item._count.halls);
      setKaroCinemaId(item.karoCinemaId);
    });
  }, [id, router]);

  useEffect(() => {
    let cancelled = false;
    const tasks = isNew ? [loadCities()] : [loadItem()];
    Promise.all(tasks)
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить данные");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isNew, loadCities, loadItem]);

  useEffect(() => {
    if (!isNew || !cityId) return;
    let cancelled = false;
    fetch(`/api/schedule/cinemas?cityId=${cityId}`)
      .then((response) => response.json())
      .then((data: { items?: ScheduleOption[] }) => {
        if (!cancelled) {
          setKaroCinemas(
            (data.items ?? []).filter((item) => item.id !== CUSTOM_OPTION_ID),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setKaroCinemas([]);
      });
    return () => {
      cancelled = true;
    };
  }, [cityId, isNew]);

  const city = cities.find((item) => item.id === cityId);
  const cinema = karoCinemas.find((item) => item.id === karoCinemaId);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const response = isNew
      ? await fetch("/api/admin/catalog/cinemas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            karoCinemaId: cinema?.id,
            name: cinema?.name,
            cityId: city?.id,
            cityName: city?.name,
            enabled: true,
          }),
        })
      : await fetch(`/api/admin/catalog/cinemas/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address }),
        });

    const data = (await response.json()) as { item?: CinemaItem; error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    if (isNew && data.item) {
      router.push(`/admin/catalogs/cinemas/${data.item.id}`);
      return;
    }
    setNotice("Сохранено");
  }

  async function onDelete() {
    if (!id || !window.confirm("Удалить кинотеатр и его залы?")) return;
    setSaving(true);
    const response = await fetch(`/api/admin/catalog/cinemas/${id}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить");
      return;
    }
    router.push("/admin/catalogs/cinemas");
  }

  return (
    <CatalogShell
      title={isNew ? "Новый кинотеатр" : name || "Кинотеатр"}
      description={
        isNew
          ? "Выберите кинотеатр сети КАРО, который участвует в аренде зала."
          : `Город: ${cityName}. Залов: ${hallsCount}. Публикация меняется в списке.`
      }
    >
      <CatalogBack href="/admin/catalogs/cinemas" label="← К списку кинотеатров" />
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : (
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="grid max-w-3xl gap-5 rounded-3xl border border-line bg-card p-6 sm:p-8"
        >
          {isNew ? (
            <>
              <Field id="rental-city" label="Город КАРО" required>
                <select
                  id="rental-city"
                  className={inputClassName}
                  value={cityId}
                  onChange={(event) => {
                    setCityId(event.target.value);
                    setKaroCinemaId("");
                    setKaroCinemas([]);
                  }}
                >
                  <option value="">Выберите город</option>
                  {cities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="rental-cinema" label="Кинотеатр сети" required>
                <select
                  id="rental-cinema"
                  className={inputClassName}
                  value={karoCinemaId}
                  disabled={!cityId}
                  onChange={(event) => setKaroCinemaId(event.target.value)}
                >
                  <option value="">Выберите кинотеатр</option>
                  {karoCinemas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
            <>
              <Field id="cinema-name" label="Название" required>
                <input
                  id="cinema-name"
                  className={inputClassName}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field id="cinema-address" label="Адрес">
                <input
                  id="cinema-address"
                  className={inputClassName}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </Field>
            </>
          )}
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          {notice ? <p className="text-sm text-gold">{notice}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || (isNew && (!city || !cinema))}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Сохраняем…" : isNew ? "Добавить" : "Сохранить"}
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
