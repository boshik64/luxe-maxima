"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ApplicationStatus } from "@prisma/client";
import { ApplicationModal } from "@/components/admin/ApplicationModal";
import { CreateApplicationModal } from "@/components/admin/CreateApplicationModal";
import { AdminNav } from "@/components/admin/AdminNav";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PRODUCT_EMOJI } from "@/lib/admin/products";
import {
  ARCHIVE_BOARD_STATUSES,
  ARCHIVE_STATUS_LABEL,
  MAIN_BOARD_STATUSES,
  STATUS_ACCENT,
  STATUS_LABEL,
  STATUSES,
} from "@/lib/admin/status";
import {
  eventDateLabel,
  formatCreatedShort,
  publicApplicationCode,
} from "@/lib/applications/dates";
import {
  contentChoiceLabel,
  guestFullName,
} from "@/lib/applications/display";
import { isWithinHours } from "@/lib/applications/event-time";
import type { ApplicationRecord } from "@/lib/applications/types";
import { PRODUCTS, type StoredProductId } from "@/lib/products";

type ManagerOption = { id: string; name: string };
type BoardKind = "main" | "archive";
type ViewMode = "kanban" | "list";

function readStoredViewMode(key: string): ViewMode {
  if (typeof window === "undefined") return "kanban";
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === "kanban" || saved === "list") return saved;
  } catch {
    // ignore
  }
  return "kanban";
}

const filterControlClass =
  "rounded-2xl border border-line bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-gold";

function isUrgentCard(item: ApplicationRecord) {
  return item.status === "IN_PROGRESS" && isWithinHours(item, 72);
}

function cardToneClass(item: ApplicationRecord) {
  if (isUrgentCard(item)) return "admin-card-urgent relative border";
  if (item.paid) {
    return item.status === "IN_PROGRESS"
      ? "admin-card-paid admin-card-paid-progress border"
      : "admin-card-paid border";
  }
  return "border border-line bg-background hover:border-gold";
}

function statusLabelForBoard(board: BoardKind, status: ApplicationStatus) {
  if (board === "archive" && (status === "CLOSED" || status === "REJECTED")) {
    return ARCHIVE_STATUS_LABEL[status];
  }
  return STATUS_LABEL[status];
}

function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-card p-1">
      <button
        type="button"
        aria-label="Канбан"
        aria-pressed={value === "kanban"}
        className={`rounded-full p-2 transition ${
          value === "kanban"
            ? "bg-primary text-white"
            : "text-muted hover:text-foreground"
        }`}
        onClick={() => onChange("kanban")}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="7" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
          <rect x="14" y="4" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Список"
        aria-pressed={value === "list"}
        className={`rounded-full p-2 transition ${
          value === "list"
            ? "bg-primary text-white"
            : "text-muted hover:text-foreground"
        }`}
        onClick={() => onChange("list")}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="4" cy="6" r="1.2" fill="currentColor" />
          <circle cx="4" cy="12" r="1.2" fill="currentColor" />
          <circle cx="4" cy="18" r="1.2" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}

function ApplicationCard({
  item,
  layout,
  board,
  draggable,
  onOpen,
  onDragStart,
  onDrag,
  onDragEnd,
}: {
  item: ApplicationRecord;
  layout: ViewMode;
  board: BoardKind;
  draggable: boolean;
  onOpen: () => void;
  onDragStart?: (event: DragEvent) => void;
  onDrag?: () => void;
  onDragEnd?: () => void;
}) {
  const urgent = isUrgentCard(item);
  if (layout === "list") {
    return (
      <article
        draggable={draggable}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onClick={onOpen}
        className={`grid cursor-pointer grid-cols-1 items-center gap-2 rounded-2xl border px-4 py-3 text-left transition sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] ${cardToneClass(item)}`}
      >
        <div className="min-w-0">
          <p className="tone-accent flex flex-wrap items-center gap-2 text-xs text-gold">
            <span>
              <span aria-hidden="true">
                {PRODUCT_EMOJI[item.productId as StoredProductId]}
              </span>{" "}
              {PRODUCTS[item.productId as StoredProductId].title} ·{" "}
              {publicApplicationCode(item.publicNumber)}
              {item.paid && !urgent ? " · Оплачено" : ""}
            </span>
            {urgent && item.paid ? (
              <span className="admin-card-paid-sticker-inline">Оплачено</span>
            ) : null}
          </p>
          <p className="mt-0.5 truncate font-medium">{guestFullName(item)}</p>
        </div>
        <div className="tone-muted min-w-0 text-sm text-muted">
          <p className="truncate">
            {item.cityName} · {item.cinemaName}
          </p>
          <p className="truncate">
            {eventDateLabel(item)
              ? `мероприятие ${eventDateLabel(item)}`
              : contentChoiceLabel(item) || "—"}
          </p>
        </div>
        <div className="tone-muted min-w-0 text-sm text-muted">
          <p>{item.manager?.name ?? "Без менеджера"}</p>
          <p className="text-xs">
            {statusLabelForBoard(board, item.status)} ·{" "}
            {formatCreatedShort(item.createdAt)}
          </p>
        </div>
        <div className="tone-muted text-xs text-muted sm:text-right">
          {item.guests ? `${item.guests} гостей` : "—"}
        </div>
      </article>
    );
  }

  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`shrink-0 cursor-pointer rounded-2xl border p-4 text-left transition ${cardToneClass(item)}`}
    >
      {urgent && item.paid ? (
        <span className="admin-card-paid-sticker">Оплачено</span>
      ) : null}
      <p
        className={`tone-muted text-[11px] text-muted ${
          urgent && item.paid ? "pr-20" : ""
        }`}
      >
        Создана: {formatCreatedShort(item.createdAt)}
        {item.paid && !urgent ? " · Оплачено" : ""}
      </p>
      <p className="tone-accent mt-1 text-xs text-gold">
        <span aria-hidden="true">
          {PRODUCT_EMOJI[item.productId as StoredProductId]}
        </span>{" "}
        {PRODUCTS[item.productId as StoredProductId].title} ·{" "}
        {publicApplicationCode(item.publicNumber)}
      </p>
      <p className="mt-1 font-medium">{guestFullName(item)}</p>
      <p className="tone-muted mt-1 text-sm text-muted">
        {item.cityName} · {item.cinemaName}
      </p>
      {contentChoiceLabel(item) ? (
        <p className="tone-muted mt-1 text-sm text-muted">
          {contentChoiceLabel(item)}
        </p>
      ) : null}
      <p className="tone-muted mt-2 text-xs text-muted">
        {item.guests ? `${item.guests} гостей` : ""}
        {item.guests && eventDateLabel(item) ? " · " : ""}
        {eventDateLabel(item) ? `мероприятие ${eventDateLabel(item)}` : ""}
      </p>
      <p className="tone-accent mt-2 text-xs text-gold">
        {item.manager?.name ?? "Без менеджера"}
      </p>
    </article>
  );
}

export function AdminDashboard({ board = "main" }: { board?: BoardKind }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = board === "archive" ? "/admin/archive" : "/admin";
  const boardStatuses =
    board === "archive" ? ARCHIVE_BOARD_STATUSES : MAIN_BOARD_STATUSES;
  const viewStorageKey = `luxe-admin-view-${board}`;

  const [items, setItems] = useState<ApplicationRecord[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [total, setTotal] = useState(0);
  const [product, setProduct] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(searchParams.get("id"));
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    readStoredViewMode(viewStorageKey),
  );
  const [storedViewKey, setStoredViewKey] = useState(viewStorageKey);
  if (storedViewKey !== viewStorageKey) {
    setStoredViewKey(viewStorageKey);
    setViewMode(readStoredViewMode(viewStorageKey));
  }
  const [collapsedStatuses, setCollapsedStatuses] = useState<
    Partial<Record<ApplicationStatus, boolean>>
  >({});
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null);
  const draggingId = useRef<string | null>(null);
  const dragged = useRef(false);

  function changeViewMode(next: ViewMode) {
    setViewMode(next);
    try {
      window.localStorage.setItem(viewStorageKey, next);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(() => {
    const params = new URLSearchParams({ pageSize: "500", board });
    if (product !== "all") params.set("productId", product);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (paidFilter !== "all") params.set("paid", paidFilter);
    if (managerFilter !== "all") params.set("managerId", managerFilter);
    if (searchQuery) params.set("q", searchQuery);
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
  }, [
    board,
    createdFrom,
    createdTo,
    managerFilter,
    paidFilter,
    product,
    router,
    searchQuery,
    statusFilter,
  ]);

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
    router.replace(`${basePath}?id=${id}`, { scroll: false });
  }

  function closeModal() {
    setOpenId(null);
    router.replace(basePath, { scroll: false });
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

  const applySavedItem = useCallback(
    (entry: ApplicationRecord) => {
      const belongsHere =
        board === "archive" ? entry.archived === true : entry.archived !== true;
      if (!belongsHere) {
        setItems((list) => list.filter((row) => row.id !== entry.id));
        setTotal((value) => Math.max(0, value - 1));
        setOpenId((id) => {
          if (id === entry.id) {
            router.replace(basePath, { scroll: false });
            return null;
          }
          return id;
        });
        return;
      }
      replaceItem(entry);
    },
    [basePath, board, replaceItem, router],
  );

  async function save(id: string, patch: Partial<ApplicationRecord>) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const raw = await response.text();
      let data: { item?: ApplicationRecord; error?: string } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as {
            item?: ApplicationRecord;
            error?: string;
          };
        } catch {
          data = {};
        }
      }
      setSaving(false);
      if (!response.ok) {
        setError(data.error ?? "Не удалось сохранить");
        await load();
        return false;
      }
      if (data.item) applySavedItem(data.item);
      return true;
    } catch {
      setSaving(false);
      setError("Не удалось сохранить");
      await load();
      return false;
    }
  }

  async function moveToStatus(id: string, status: ApplicationStatus) {
    const current = items.find((item) => item.id === id);
    if (!current || current.status === status) return;
    setItems((list) =>
      list.map((item) => (item.id === id ? { ...item, status } : item)),
    );
    await save(id, { status });
  }

  const columns = boardStatuses.map((status) => ({
    status,
    items: items.filter((item) => item.status === status),
  }));

  function toggleStatusCollapsed(status: ApplicationStatus) {
    setCollapsedStatuses((current) => ({
      ...current,
      [status]: !current[status],
    }));
  }

  function bindDrag(item: ApplicationRecord) {
    return {
      onDragStart: (event: DragEvent) => {
        draggingId.current = item.id;
        dragged.current = false;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.id);
      },
      onDrag: () => {
        dragged.current = true;
      },
      onDragEnd: () => {
        draggingId.current = null;
        setDragOver(null);
      },
      onOpen: () => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        openModal(item.id);
      },
    };
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[1800px] flex-col overflow-hidden px-4 py-6">
      <div className="shrink-0">
        <AdminNav />
      </div>
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-baseline gap-3 font-[family-name:var(--font-display)] text-3xl">
          {board === "archive" ? "Архив" : "Заявки"}
          <span className="text-base font-normal text-muted">{total}</span>
        </h1>
        {board === "main" ? (
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            onClick={() => setCreating(true)}
          >
            Создать заявку
          </button>
        ) : null}
      </div>

      <div className="mb-2 flex shrink-0 flex-wrap items-center gap-3">
        <input
          type="search"
          aria-label="Поиск"
          className={`${filterControlClass} w-56`}
          placeholder="Имя, зал, комментарий…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
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
            ...(board === "archive" ? ARCHIVE_BOARD_STATUSES : STATUSES).map(
              (status) => ({
                value: status,
                label: statusLabelForBoard(board, status),
              }),
            ),
          ]}
          onChange={setStatusFilter}
        />
        <CustomSelect
          id="paid-filter"
          className="w-44"
          value={paidFilter}
          options={[
            { value: "all", label: "Оплата: все" },
            { value: "paid", label: "Оплачено" },
            { value: "unpaid", label: "Не оплачено" },
          ]}
          onChange={setPaidFilter}
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
        <label className="flex items-center gap-2 text-sm text-muted">
          <span>С</span>
          <input
            type="date"
            className={filterControlClass}
            value={createdFrom}
            onChange={(event) => setCreatedFrom(event.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span>По</span>
          <input
            type="date"
            className={filterControlClass}
            value={createdTo}
            onChange={(event) => setCreatedTo(event.target.value)}
          />
        </label>
        <div className="ml-auto">
          <ViewModeToggle value={viewMode} onChange={changeViewMode} />
        </div>
      </div>

      {error ? (
        <p className="mb-2 shrink-0 text-sm text-primary">{error}</p>
      ) : null}

      {viewMode === "kanban" ? (
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
                  event.dataTransfer.getData("text/plain") ||
                  draggingId.current;
                if (id) void moveToStatus(id, column.status);
              }}
            >
              <header className="mb-3 flex shrink-0 items-center justify-between px-2 pt-1">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: STATUS_ACCENT[column.status] }}
                  />
                  {statusLabelForBoard(board, column.status)}
                </h2>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                  {column.items.length}
                </span>
              </header>
              <div className="pretty-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pr-1">
                {column.items.map((item) => {
                  const drag = bindDrag(item);
                  return (
                    <ApplicationCard
                      key={item.id}
                      item={item}
                      layout="kanban"
                      board={board}
                      draggable
                      {...drag}
                    />
                  );
                })}
                {column.items.length === 0 ? (
                  <p className="px-2 py-8 text-center text-sm text-muted">
                    Перетащите заявку сюда
                  </p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="pretty-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
          {items.length === 0 ? (
            <p className="rounded-3xl border border-line bg-card/60 px-4 py-12 text-center text-sm text-muted">
              Нет заявок по текущим фильтрам
            </p>
          ) : (
            columns.map((column) => {
              const collapsed = collapsedStatuses[column.status] === true;
              return (
                <section
                  key={column.status}
                  className="overflow-hidden rounded-3xl border border-line bg-card/60"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-background/40"
                    aria-expanded={!collapsed}
                    onClick={() => toggleStatusCollapsed(column.status)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <svg
                        className={`h-4 w-4 text-muted transition ${
                          collapsed ? "" : "rotate-90"
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M7.3 4.7a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.58 10 7.3 6.1a1 1 0 0 1 0-1.4Z" />
                      </svg>
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: STATUS_ACCENT[column.status] }}
                      />
                      {statusLabelForBoard(board, column.status)}
                    </span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                      {column.items.length}
                    </span>
                  </button>
                  {!collapsed ? (
                    <div className="space-y-2 border-t border-line px-3 py-3">
                      {column.items.length === 0 ? (
                        <p className="px-1 py-4 text-center text-sm text-muted">
                          Нет заявок
                        </p>
                      ) : (
                        column.items.map((item) => {
                          const drag = bindDrag(item);
                          return (
                            <ApplicationCard
                              key={item.id}
                              item={item}
                              layout="list"
                              board={board}
                              draggable={false}
                              {...drag}
                            />
                          );
                        })
                      )}
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
        </div>
      )}

      {creating && board === "main" ? (
        <CreateApplicationModal
          onClose={() => setCreating(false)}
          onCreated={(item) => {
            setCreating(false);
            setItems((current) => [
              item,
              ...current.filter((entry) => entry.id !== item.id),
            ]);
            setTotal((value) => value + 1);
            openModal(item.id);
          }}
        />
      ) : null}

      {openItem ? (
        <ApplicationModal
          key={openItem.id}
          item={openItem}
          managers={managers}
          board={board}
          saving={saving}
          error={error}
          onClose={closeModal}
          onSave={(patch) => save(openItem.id, patch)}
          onItem={applySavedItem}
        />
      ) : null}
    </main>
  );
}
