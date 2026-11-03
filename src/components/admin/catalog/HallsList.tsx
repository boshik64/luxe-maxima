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
import type { HallItem } from "@/lib/catalog/admin-types";
import { formatHallPrices } from "@/lib/catalog/format";

const YES_NO_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "yes", label: "Да" },
  { value: "no", label: "Нет" },
];

export function HallsList() {
  const router = useRouter();
  const [items, setItems] = useState<HallItem[]>([]);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [cinemaFilter, setCinemaFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [publishFilter, setPublishFilter] = useState("all");
  const [consoleFilter, setConsoleFilter] = useState("all");
  const [onRequestFilter, setOnRequestFilter] = useState("all");

  const load = useCallback(() => {
    return fetch("/api/admin/catalog/halls").then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as {
        items?: HallItem[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить залы");
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
      if (!cancelled) setError("Не удалось загрузить залы");
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const cityOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      const key = item.cinema.cityName;
      if (!map.has(key)) map.set(key, key);
    }
    return [
      { value: "all", label: "Все города" },
      ...[...map.keys()]
        .sort((a, b) => a.localeCompare(b, "ru"))
        .map((value) => ({ value, label: value })),
    ];
  }, [items]);

  const cinemaOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (cityFilter !== "all" && item.cinema.cityName !== cityFilter) continue;
      if (!map.has(item.cinemaId)) map.set(item.cinemaId, item.cinema.name);
    }
    return [
      { value: "all", label: "Все кинотеатры" },
      ...[...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "ru"))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [items, cityFilter]);

  const formatOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      if (!map.has(item.formatId)) map.set(item.formatId, item.format.name);
    }
    return [
      { value: "all", label: "Все форматы" },
      ...[...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "ru"))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (cityFilter !== "all" && item.cinema.cityName !== cityFilter) {
          return false;
        }
        if (cinemaFilter !== "all" && item.cinemaId !== cinemaFilter) {
          return false;
        }
        if (formatFilter !== "all" && item.formatId !== formatFilter) {
          return false;
        }
        if (!matchesPublishFilter(item.enabled !== false, publishFilter)) {
          return false;
        }
        if (consoleFilter === "yes" && !item.consoleGaming) return false;
        if (consoleFilter === "no" && item.consoleGaming) return false;
        if (onRequestFilter === "yes" && !item.priceOnRequest) return false;
        if (onRequestFilter === "no" && item.priceOnRequest) return false;
        return true;
      }),
    [
      items,
      cityFilter,
      cinemaFilter,
      formatFilter,
      publishFilter,
      consoleFilter,
      onRequestFilter,
    ],
  );

  async function togglePublished(item: HallItem) {
    setPendingId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/catalog/halls/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: item.enabled === false }),
      });
      const data = (await response.json()) as { item?: HallItem; error?: string };
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
      title="Залы"
      description="Конкретные залы с форматом, вместимостью и стоимостью аренды. Откройте запись, чтобы изменить её."
      action={
        <Link
          href="/admin/catalogs/halls/new"
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Добавить зал
        </Link>
      }
    >
      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      <CatalogFilters
        fields={[
          {
            id: "hall-city-filter",
            label: "Город",
            value: cityFilter,
            options: cityOptions,
            onChange: (value) => {
              setCityFilter(value);
              setCinemaFilter("all");
            },
          },
          {
            id: "hall-cinema-filter",
            label: "Кинотеатр",
            value: cinemaFilter,
            options: cinemaOptions,
            onChange: setCinemaFilter,
          },
          {
            id: "hall-format-filter",
            label: "Формат",
            value: formatFilter,
            options: formatOptions,
            onChange: setFormatFilter,
          },
          {
            id: "hall-publish-filter",
            label: "Публикация",
            value: publishFilter,
            options: PUBLISH_FILTER_OPTIONS,
            onChange: setPublishFilter,
          },
          {
            id: "hall-console-filter",
            label: "Приставка",
            value: consoleFilter,
            options: YES_NO_OPTIONS,
            onChange: setConsoleFilter,
          },
          {
            id: "hall-request-filter",
            label: "Цена по запросу",
            value: onRequestFilter,
            options: YES_NO_OPTIONS,
            onChange: setOnRequestFilter,
          },
        ]}
      />
      <CatalogTable
        columns={["Зал", "Кинотеатр", "Формат", "Вместимость", "Стоимость", "Публикация", ""]}
      >
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">
              {error
                ? "Список недоступен."
                : items.length === 0
                  ? "Пока нет залов. Добавьте первую запись."
                  : "Нет записей по выбранным фильтрам."}
            </td>
          </tr>
        ) : (
          filtered.map((item) => (
            <tr key={item.id} className={catalogRowClass}>
              <td className="px-5 py-4 font-medium">
                <CatalogRowLink href={`/admin/catalogs/halls/${item.id}`}>
                  {item.name}
                </CatalogRowLink>
              </td>
              <td className="px-5 py-4 text-sm text-muted">
                {item.cinema.cityName} · {item.cinema.name}
              </td>
              <td className="px-5 py-4 text-sm text-muted">{item.format.name}</td>
              <td className="px-5 py-4 text-sm text-muted">{item.capacity}</td>
              <td className="px-5 py-4 text-sm text-muted">
                {formatHallPrices(
                  item.rentalPriceWeekday,
                  item.rentalPriceWeekend,
                  item.priceOnRequest,
                )}
                {item.consoleGaming ? " · приставка" : ""}
              </td>
              <td className="px-5 py-4">
                <PublishStatusButton
                  published={item.enabled !== false}
                  pending={pendingId === item.id}
                  onToggle={() => void togglePublished(item)}
                />
              </td>
              <td className="px-5 py-4 text-right">
                <CatalogRowLink href={`/admin/catalogs/halls/${item.id}`}>
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
