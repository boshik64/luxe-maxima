"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Application, ApplicationStatus } from "@prisma/client";
import { ApplicationModal } from "@/components/admin/ApplicationModal";
import { AdminNav } from "@/components/admin/AdminNav";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PRODUCT_EMOJI } from "@/lib/admin/products";
import { STATUS_ACCENT, STATUS_LABEL, STATUSES } from "@/lib/admin/status";
import { PRODUCTS, type StoredProductId } from "@/lib/products";

export function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [product, setProduct] = useState("all");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(searchParams.get("id"));
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null);
  const draggingId = useRef<string | null>(null);
  const dragged = useRef(false);

  const load = useCallback(() => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (product !== "all") params.set("productId", product);
    return fetch(`/api/admin/applications?${params}`).then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as {
        items?: Application[];
        total?: number;
      };
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    });
  }, [product, router]);

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setError("Не удалось загрузить заявки");
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const openItem = useMemo(
    () => items.find((item) => item.id === openId) ?? null,
    [items, openId],
  );

  function openModal(id: string) {
    setOpenId(id);
    router.replace(`/admin?id=${id}`, { scroll: false });
  }

  function closeModal() {
    setOpenId(null);
    router.replace("/admin", { scroll: false });
  }

  async function save(id: string, patch: Partial<Application>) {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await response.json()) as {
      item?: Application;
      error?: string;
    };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось сохранить");
      await load();
      return false;
    }
    if (data.item) {
      setItems((current) =>
        current.map((item) => (item.id === id ? data.item! : item)),
      );
    }
    return true;
  }

  async function moveToStatus(id: string, status: ApplicationStatus) {
    const current = items.find((item) => item.id === id);
    if (!current || current.status === status) return;
    setItems((list) =>
      list.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    await save(id, { status });
  }

  const columns = STATUSES.map((status) => ({
    status,
    items: items.filter((item) => item.status === status),
  }));

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[1600px] flex-col overflow-hidden px-4 py-6">
      <div className="shrink-0">
        <AdminNav />
      </div>
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Заявки
          </h1>
          <p className="mt-2 text-sm text-muted">
            Канбан по статусам. Карточка открывается в окне, статус можно сменить
            перетаскиванием. Всего: {total}
          </p>
        </div>
        <CustomSelect
          id="product-filter"
          className="w-56"
          value={product}
          options={[
            { value: "all", label: "Все продукты" },
            ...Object.values(PRODUCTS).map((item) => ({
              value: item.id,
              label: `${PRODUCT_EMOJI[item.id]} ${item.title}`,
            })),
          ]}
          onChange={setProduct}
        />
      </div>

      {error ? (
        <p className="mb-3 shrink-0 text-sm text-primary">{error}</p>
      ) : null}

      <div className="pretty-scroll flex min-h-0 flex-1 gap-4 overflow-x-auto">
        {columns.map((column) => (
          <section
            key={column.status}
            className={`flex min-h-0 min-w-72 flex-1 flex-col overflow-hidden rounded-3xl border bg-card/60 p-3 transition ${
              dragOver === column.status ? "border-gold" : "border-line"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(column.status);
            }}
            onDragLeave={() => {
              setDragOver((value) =>
                value === column.status ? null : value,
              );
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(null);
              const id =
                event.dataTransfer.getData("text/plain") || draggingId.current;
              if (id) void moveToStatus(id, column.status);
            }}
          >
            <header className="mb-3 flex shrink-0 items-center justify-between px-2 pt-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: STATUS_ACCENT[column.status] }}
                />
                {STATUS_LABEL[column.status]}
              </h2>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                {column.items.length}
              </span>
            </header>
            <div className="pretty-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pr-1">
              {column.items.map((item) => (
                <article
                  key={item.id}
                  draggable
                  onDragStart={(event) => {
                    draggingId.current = item.id;
                    dragged.current = false;
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", item.id);
                  }}
                  onDrag={() => {
                    dragged.current = true;
                  }}
                  onDragEnd={() => {
                    draggingId.current = null;
                    setDragOver(null);
                  }}
                  onClick={() => {
                    if (dragged.current) {
                      dragged.current = false;
                      return;
                    }
                    openModal(item.id);
                  }}
                  className="shrink-0 cursor-pointer rounded-2xl border border-line bg-background p-4 text-left transition hover:border-gold"
                >
                  <p className="text-xs text-gold">
                    <span aria-hidden="true">
                      {PRODUCT_EMOJI[item.productId as StoredProductId]}
                    </span>{" "}
                    {PRODUCTS[item.productId as StoredProductId].title}
                  </p>
                  <p className="mt-1 font-medium">{item.contactName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.cityName} · {item.cinemaName}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {item.guests ? `${item.guests} гостей · ` : ""}
                    {new Date(item.createdAt).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </article>
              ))}
              {column.items.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted">
                  Перетащите заявку сюда
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {openItem ? (
        <ApplicationModal
          key={openItem.id}
          item={openItem}
          saving={saving}
          error={error}
          onClose={closeModal}
          onSave={(patch) => save(openItem.id, patch)}
        />
      ) : null}
    </main>
  );
}
