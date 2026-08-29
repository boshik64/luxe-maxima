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
import { FORMAT_SHOWCASE_MAX, type FormatItem } from "@/lib/catalog/admin-types";

export function FormatsList() {
  const router = useRouter();
  const [items, setItems] = useState<FormatItem[]>([]);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  const load = useCallback(() => {
    return fetch("/api/admin/catalog/formats").then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as {
        items?: FormatItem[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить форматы");
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
      if (!cancelled) setError("Не удалось загрузить форматы");
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function togglePublished(item: FormatItem) {
    setPendingId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/catalog/formats/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: item.enabled === false }),
      });
      const data = (await response.json()) as { item?: FormatItem; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Не удалось изменить публикацию");
        return;
      }
      if (data.item) {
        setItems((current) =>
          current.map((row) =>
            row.id === item.id ? { ...row, ...data.item, enabled: data.item!.enabled } : row,
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
      title="Форматы зала"
      description={`Картинка на главной — не больше ${FORMAT_SHOWCASE_MAX} форматов. Очередность и публикацию картинки задайте в карточке формата.`}
      action={
        <Link
          href="/admin/catalogs/formats/new"
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Добавить формат
        </Link>
      }
    >
      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      <CatalogTable
        columns={["Название", "Преимущества", "Залов", "Публикация", "На главной", ""]}
      >
        {items.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted">
              {error
                ? "Список недоступен."
                : "Пока нет форматов. Добавьте первую запись."}
            </td>
          </tr>
        ) : (
          items.map((item) => (
            <tr key={item.id} className={catalogRowClass}>
              <td className="px-5 py-4 font-medium">
                <CatalogRowLink href={`/admin/catalogs/formats/${item.id}`}>
                  {item.name}
                </CatalogRowLink>
              </td>
              <td className="px-5 py-4 text-sm text-muted">
                {item.benefits.slice(0, 2).join(" · ") || "—"}
                {item.benefits.length > 2 ? "…" : ""}
              </td>
              <td className="px-5 py-4 text-sm text-muted">{item._count.halls}</td>
              <td className="px-5 py-4">
                <PublishStatusButton
                  published={item.enabled !== false}
                  pending={pendingId === item.id}
                  onToggle={() => void togglePublished(item)}
                />
              </td>
              <td className="px-5 py-4 text-sm text-muted">
                {item.showcasePublished ? `да · ${item.showcaseOrder}` : "нет"}
              </td>
              <td className="px-5 py-4 text-right">
                <CatalogRowLink href={`/admin/catalogs/formats/${item.id}`}>
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
