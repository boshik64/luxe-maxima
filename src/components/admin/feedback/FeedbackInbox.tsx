"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Feedback, FeedbackStatus } from "@prisma/client";
import { AdminPage } from "@/components/admin/AdminPage";
import { catalogRowClass } from "@/components/admin/catalog/CatalogTable";
import { FEEDBACK_STATUS_LABEL } from "@/lib/feedback/status";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Все" },
  { value: "NEW", label: "Новые" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "CLOSED", label: "Закрытые" },
];

export function FeedbackInbox() {
  const router = useRouter();
  const [status, setStatus] = useState("NEW");
  const [items, setItems] = useState<Feedback[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const query = status ? `?status=${status}` : "";
    return fetch(`/api/admin/feedback${query}`).then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as {
        items?: Feedback[];
        newCount?: number;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить обращения");
        return;
      }
      setItems(data.items ?? []);
      setNewCount(data.newCount ?? 0);
    });
  }, [router, status]);

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setError("Не удалось загрузить обращения");
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <AdminPage
      title="Обратная связь"
      description={`Отдельная очередь со страницы «Обратная связь», не смешивается с заявками на услуги. Новых: ${newCount}.`}
    >
      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            className={`rounded-full px-4 py-2 text-sm ${
              status === filter.value
                ? "bg-primary text-white"
                : "border border-line text-muted hover:text-foreground"
            }`}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border border-line bg-card">
        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            В этой папке пока пусто.
          </p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className={catalogRowClass}>
                <Link
                  href={`/admin/feedback/${item.id}`}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-muted">
                      {item.message}
                    </p>
                  </div>
                  <div className="shrink-0 text-sm text-muted">
                    <p>
                      {FEEDBACK_STATUS_LABEL[item.status as FeedbackStatus]}
                    </p>
                    <p>
                      {new Date(item.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminPage>
  );
}
