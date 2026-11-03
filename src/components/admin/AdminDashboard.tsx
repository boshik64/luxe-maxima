"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ApplicationStatus } from "@prisma/client";
import { ApplicationModal } from "@/components/admin/ApplicationModal";
import { CreateApplicationModal } from "@/components/admin/CreateApplicationModal";
import { AdminNav } from "@/components/admin/AdminNav";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PRODUCT_EMOJI } from "@/lib/admin/products";
import { STATUS_ACCENT, STATUS_LABEL, STATUSES } from "@/lib/admin/status";
import {
  eventDateLabel,
  formatCreatedShort,
  publicApplicationCode,
} from "@/lib/applications/dates";
import type { ApplicationRecord } from "@/lib/applications/types";
import { PRODUCTS, type StoredProductId } from "@/lib/products";

type ManagerOption = { id: string; name: string };

export function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ApplicationRecord[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [total, setTotal] = useState(0);
  const [product, setProduct] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(searchParams.get("id"));
  const [creating, setCreating] = useState(false);
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null);
  const draggingId = useRef<string | null>(null);
  const dragged = useRef(false);

  const load = useCallback(() => {
    const params = new URLSearchParams({ pageSize: "200" });
    if (product !== "all") params.set("productId", product);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (managerFilter !== "all") params.set("managerId", managerFilter);
    if (createdFrom) params.set("createdFrom", createdFrom);
    if (createdTo) params.set("createdTo", createdTo);
    return fetch(`/api/admin/applications?${params}`).then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as {
        items?: ApplicationRecord[];
        total?: number;
      };
      const incoming = data.items ?? [];
      setItems((previous) => {
        const kept = new Map(
          previous
            .filter((item) => Array.isArray(item.messages))
            .map((item) => [item.id, item.messages!] as const),
        );
        return incoming.map((item) => {
          if (Array.isArray(item.messages)) return item;
          const messages = kept.get(item.id);
          return messages ? { ...item, messages } : item;
        });
      });
      setTotal(data.total ?? 0);
    });
  }, [createdFrom, createdTo, managerFilter, product, router, statusFilter]);

  useEffect(() => {
    fetch("/api/admin/managers")
      .then(async (response) => {
        const data = (await response.json()) as { items?: ManagerOption[] };
        setManagers(data.items ?? []);
      })
      .catch(() => undefined);
  }, []);

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

  const replaceItem = useCallback((next: ApplicationRecord) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== next.id) return item;
        if (Array.isArray(next.messages)) return next;
        return {
          ...next,
          messages: item.messages,
        };
      }),
    );
  }, []);

  async function save(id: string, patch: Partial<ApplicationRecord>) {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await response.json()) as {
      item?: ApplicationRecord;
      error?: string;
    };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось сохранить");
      await load();
      return false;
    }
    if (data.item) replaceItem(data.item);
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
    <main className="mx-auto flex h-dvh w-full max-w-[1800px] flex-col overflow-hidden px-4 py-6">
      <div className="shrink-0">
        <AdminNav />
      </div>
      <div className="mb-4 flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Заявки
          </h1>
          <p className="mt-2 text-sm text-muted">
            Канбан по статусам. Карточка открывается в окне, статус можно сменить
            перетаскиванием. Всего: {total}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            onClick={() => setCreating(true)}
          >
            Создать заявку
          </button>
          <CustomSelect
            id="product-filter"
            className="w-52"
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
          <CustomSelect
            id="status-filter"
            className="w-48"
            value={statusFilter}
            options={[
              { value: "all", label: "Все статусы" },
              ...STATUSES.map((status) => ({
                value: status,
                label: STATUS_LABEL[status],
              })),
            ]}
            onChange={setStatusFilter}
          />
          <CustomSelect
            id="manager-filter"
            className="w-52"
            value={managerFilter}
            options={[
              { value: "all", label: "Все менеджеры" },
              { value: "unassigned", label: "Без менеджера" },
              ...managers.map((item) => ({ value: item.id, label: item.name })),
            ]}
            onChange={setManagerFilter}
          />
          <label className="text-xs text-muted">
            С
            <input
              type="date"
              className="mt-1 block rounded-full border border-line bg-card px-3 py-2 text-sm text-foreground"
              value={createdFrom}
              onChange={(event) => setCreatedFrom(event.target.value)}
            />
          </label>
          <label className="text-xs text-muted">
            По
            <input
              type="date"
              className="mt-1 block rounded-full border border-line bg-card px-3 py-2 text-sm text-foreground"
              value={createdTo}
              onChange={(event) => setCreatedTo(event.target.value)}
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="mb-3 shrink-0 text-sm text-primary">{error}</p>
      ) : null}

      <div className="pretty-scroll flex min-h-0 flex-1 gap-4 overflow-x-auto">
        {columns.map((column) => (
          <section
            key={column.status}
            className={`flex min-h-0 min-w-64 flex-1 flex-col overflow-hidden rounded-3xl border bg-card/60 p-3 transition ${
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
                  <p className="text-[11px] text-muted">
                    Создана: {formatCreatedShort(item.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-gold">
                    <span aria-hidden="true">
                      {PRODUCT_EMOJI[item.productId as StoredProductId]}
                    </span>{" "}
                    {PRODUCTS[item.productId as StoredProductId].title} ·{" "}
                    {publicApplicationCode(item.publicNumber)}
                  </p>
                  <p className="mt-1 font-medium">{item.contactName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.cityName} · {item.cinemaName}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {item.guests ? `${item.guests} гостей` : ""}
                    {item.guests && eventDateLabel(item) ? " · " : ""}
                    {eventDateLabel(item)
                      ? `мероприятие ${eventDateLabel(item)}`
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-gold">
                    {item.manager?.name ?? "Без менеджера"}
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

      {creating ? (
        <CreateApplicationModal
          onClose={() => setCreating(false)}
          onCreated={(item) => {
            setCreating(false);
            setItems((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
            setTotal((value) => value + 1);
            openModal(item.id);
          }}
        />
      ) : null}

      {openItem ? (
        <ApplicationModal
          key={openItem.id}
          item={openItem}
          saving={saving}
          error={error}
          onClose={closeModal}
          onSave={(patch) => save(openItem.id, patch)}
          onItem={replaceItem}
        />
      ) : null}
    </main>
  );
}
