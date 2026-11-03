"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CatalogFilters,
  matchesPublishFilter,
  PUBLISH_FILTER_OPTIONS,
} from "@/components/admin/catalog/CatalogFilters";
import { CatalogShell } from "@/components/admin/catalog/CatalogShell";
import { PublishStatusButton } from "@/components/admin/catalog/PublishStatusButton";
import {
  CatalogRowLink,
  CatalogTable,
  catalogRowClass,
} from "@/components/admin/catalog/CatalogTable";
import type { CinemaItem } from "@/lib/catalog/admin-types";

export function CinemasList() {
  const router = useRouter();
  const [items, setItems] = useState<CinemaItem[]>([]);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState("all");

  const load = useCallback(() => {
    return fetch("/api/admin/catalog/cinemas").then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as {
        items?: CinemaItem[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить кинотеатры");
        setItems([]);
        return;
      }
      setError("");
      setItems(data.items ?? []);
    });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setError("Не удалось загрузить кинотеатры");
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const cityOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (!map.has(item.cityId)) map.set(item.cityId, item.cityName);
    }
    return [
      { value: "all", label: "Все города" },
      ...[...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "ru"))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (cityFilter !== "all" && item.cityId !== cityFilter) return false;
        return matchesPublishFilter(item.enabled !== false, publishFilter);
      }),
    [items, cityFilter, publishFilter],
  );

  async function togglePublished(item: CinemaItem) {
    setPendingId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/catalog/cinemas/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: item.enabled === false }),
      });
      const data = (await response.json()) as { item?: CinemaItem; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Не удалось изменить публикацию");
        return;
      }
      if (data.item) {
        setItems((current) =>
          current.map((row) =>
            row.id === item.id ? { ...row, enabled: data.item!.enabled } : row,
          ),
        );
      }
    } catch {
      setError("Не удалось изменить публикацию");
    } finally {
      setPendingId("");
    }
  }

  return (
    <CatalogShell
      title="Кинотеатры для аренды"
      description="В списке только кинотеатры, доступные для «Ключей от зала» и «Мероприятия». Откройте запись, чтобы изменить её."
      action={
        <Link
          href="/admin/catalogs/cinemas/new"
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Добавить кинотеатр
        </Link>
      }
    >
      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      <CatalogFilters
        fields={[
          {
            id: "cinema-city-filter",
            label: "Город",
            value: cityFilter,
            options: cityOptions,
            onChange: setCityFilter,
          },
          {
            id: "cinema-publish-filter",
            label: "Публикация",
            value: publishFilter,
            options: PUBLISH_FILTER_OPTIONS,
            onChange: setPublishFilter,
          },
        ]}
      />
      <CatalogTable columns={["Кинотеатр", "Город", "Залов", "Публикация", ""]}>
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted">
              {error
                ? "Список недоступен."
                : items.length === 0
                  ? "Пока нет кинотеатров в каталоге аренды."
                  : "Нет записей по выбранным фильтрам."}
            </td>
          </tr>
        ) : (
          filtered.map((item) => (
            <tr key={item.id} className={catalogRowClass}>
              <td className="px-5 py-4 font-medium">
                <CatalogRowLink href={`/admin/catalogs/cinemas/${item.id}`}>
                  {item.name}
                </CatalogRowLink>
              </td>
              <td className="px-5 py-4 text-sm text-muted">{item.cityName}</td>
              <td className="px-5 py-4 text-sm text-muted">{item._count.halls}</td>
              <td className="px-5 py-4">
                <PublishStatusButton
                  published={item.enabled !== false}
                  pending={pendingId === item.id}
                  onToggle={() => void togglePublished(item)}
                />
              </td>
              <td className="px-5 py-4 text-right">
                <CatalogRowLink href={`/admin/catalogs/cinemas/${item.id}`}>
                  Открыть
                </CatalogRowLink>
              </td>
            </tr>
          ))
        )}
      </CatalogTable>
    </CatalogShell>
  );
}
