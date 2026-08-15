"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogShell } from "@/components/admin/catalog/CatalogShell";
import { PublishStatusButton } from "@/components/admin/catalog/PublishStatusButton";
import {
  CatalogRowLink,
  CatalogTable,
  catalogRowClass,
} from "@/components/admin/catalog/CatalogTable";
import type { HallItem } from "@/lib/catalog/admin-types";
import { formatRubles } from "@/lib/catalog/format";

export function HallsList() {
  const router = useRouter();
  const [items, setItems] = useState<HallItem[]>([]);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

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
      <CatalogTable
        columns={["Зал", "Кинотеатр", "Формат", "Вместимость", "Стоимость", "Публикация", ""]}
      >
        {items.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">
              {error
                ? "Список недоступен."
                : "Пока нет залов. Добавьте первую запись."}
            </td>
          </tr>
        ) : (
          items.map((item) => (
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
                {formatRubles(item.rentalPrice)}
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
