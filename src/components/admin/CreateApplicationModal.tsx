"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AdminFilmPicker } from "@/components/admin/AdminFilmPicker";
import { GuestField } from "@/components/admin/GuestField";
import { DatePicker, DateTimePicker } from "@/components/form/DatePicker";
import { CustomSelect, type SelectOption } from "@/components/ui/CustomSelect";
import { PRODUCT_EMOJI } from "@/lib/admin/products";
import { createClientId } from "@/lib/id";
import type { ApplicationRecord } from "@/lib/applications/types";
import { PRODUCTS, PRODUCT_IDS, TICKET_TYPES, type ProductId } from "@/lib/products";

type CatalogCinema = {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  enabled: boolean;
};

type CatalogHall = {
  id: string;
  name: string;
  cinemaId: string;
  capacity: number;
  rentalPriceWeekday: number;
  rentalPriceWeekend: number;
  format: { id: string; name: string };
  cinema: { id: string; name: string; cityName: string };
};

type Draft = {
  productId: ProductId;
  contactName: string;
  phone: string;
  email: string;
  cityId: string;
  cityName: string;
  cinemaId: string;
  cinemaName: string;
  hallId: string;
  hallName: string;
  hallFormatId: string;
  hallFormatName: string;
  hallCapacity: number | null;
  filmId: string;
  filmName: string;
  watchCustom: string;
  sessionId: string;
  sessionLabel: string;
  guests: string;
  ticketType: string;
  rentalDate: string;
  rentalStart: string;
  comment: string;
  adminComment: string;
};

const emptyDraft = (productId: ProductId = "keys"): Draft => ({
  productId,
  contactName: "",
  phone: "+7",
  email: "",
  cityId: "",
  cityName: "",
  cinemaId: "",
  cinemaName: "",
  hallId: "",
  hallName: "",
  hallFormatId: "",
  hallFormatName: "",
  hallCapacity: null,
  filmId: "",
  filmName: "",
  watchCustom: "",
  sessionId: "",
  sessionLabel: "",
  guests: "",
  ticketType: "",
  rentalDate: "",
  rentalStart: "",
  comment: "",
  adminComment: "",
});

const TICKET_OPTIONS = TICKET_TYPES.map((item) => ({
  value: item.value,
  label: item.label,
}));

function catalogField(id: string, name: string, custom = "") {
  if (!id && !custom) return { id: "", name: "", custom: "" };
  return { id, name, custom };
}

export function CreateApplicationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (item: ApplicationRecord) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [idempotencyKey] = useState(() => createClientId());

  const [catalogCinemas, setCatalogCinemas] = useState<CatalogCinema[]>([]);
  const [catalogHalls, setCatalogHalls] = useState<CatalogHall[]>([]);
  const [scheduleCities, setScheduleCities] = useState<SelectOption[]>([]);
  const [scheduleCinemas, setScheduleCinemas] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [sessions, setSessions] = useState<SelectOption[]>([]);

  const isRental = draft.productId === "keys" || draft.productId === "event";
  const isGroup = draft.productId === "group";

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      if (isRental) {
        const [cinemasRes, hallsRes] = await Promise.all([
          fetch("/api/admin/catalog/cinemas"),
          fetch("/api/admin/catalog/halls"),
        ]);
        const cinemasData = (await cinemasRes.json()) as { items?: CatalogCinema[] };
        const hallsData = (await hallsRes.json()) as { items?: CatalogHall[] };
        if (!cancelled) {
          setCatalogCinemas(cinemasData.items ?? []);
          setCatalogHalls(hallsData.items ?? []);
        }
      }
      if (isGroup || draft.productId === "keys") {
        const citiesRes = await fetch("/api/schedule/cities");
        const citiesData = (await citiesRes.json()) as {
          items?: Array<{ id: string; name: string }>;
        };
        if (!cancelled) {
          setScheduleCities(
            (citiesData.items ?? [])
              .filter((city) => city.id !== "custom")
              .map((city) => ({ value: city.id, label: city.name })),
          );
        }
      }
    }
    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [isRental, isGroup, draft.productId]);

  useEffect(() => {
    if (!isGroup) return;
    const cityId = draft.cityId;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      if (!cityId) {
        setScheduleCinemas([]);
        return;
      }
      void (async () => {
        const response = await fetch(`/api/schedule/cinemas?cityId=${cityId}`);
        const data = (await response.json()) as {
          items?: Array<{ id: string; name: string }>;
        };
        if (cancelled) return;
        setScheduleCinemas(
          (data.items ?? []).filter((cinema) => cinema.id !== "custom"),
        );
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isGroup, draft.cityId]);

  useEffect(() => {
    if (!isGroup) return;
    const cinemaId = draft.cinemaId;
    const filmId = draft.filmId;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      if (!cinemaId || !filmId || !/^\d+$/.test(cinemaId)) {
        setSessions([]);
        return;
      }
      void (async () => {
        const params = new URLSearchParams({ cinemaId, filmId });
        const response = await fetch(`/api/schedule/sessions?${params}`);
        const data = (await response.json()) as {
          items?: Array<{ id: string; name: string }>;
        };
        if (cancelled) return;
        setSessions(
          (data.items ?? [])
            .filter((session) => session.id !== "custom")
            .map((session) => ({ value: session.id, label: session.name })),
        );
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isGroup, draft.cinemaId, draft.filmId]);

  const rentalCityOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const cinema of catalogCinemas) {
      if (!map.has(cinema.cityId)) map.set(cinema.cityId, cinema.cityName);
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [catalogCinemas]);

  const rentalCinemaOptions = useMemo(
    () =>
      catalogCinemas
        .filter((cinema) => !draft.cityId || cinema.cityId === draft.cityId)
        .map((cinema) => ({ value: cinema.id, label: cinema.name })),
    [catalogCinemas, draft.cityId],
  );

  const rentalHallOptions = useMemo(
    () =>
      catalogHalls
        .filter((hall) => !draft.cinemaId || hall.cinemaId === draft.cinemaId)
        .map((hall) => ({
          value: hall.id,
          label: `${hall.name} · ${hall.format.name}`,
        })),
    [catalogHalls, draft.cinemaId],
  );

  const groupCinemaOptions = useMemo(
    () =>
      scheduleCinemas.map((cinema) => ({
        value: cinema.id,
        label: cinema.name,
      })),
    [scheduleCinemas],
  );

  const filmEndpoint =
    draft.productId === "keys"
      ? "/api/schedule/repertoire"
      : isGroup && draft.cinemaId && /^\d+$/.test(draft.cinemaId)
        ? `/api/schedule/films?cinemaId=${draft.cinemaId}`
        : null;

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function onProductChange(productId: ProductId) {
    setDraft(emptyDraft(productId));
    setFieldErrors({});
    setError("");
    setSessions([]);
    setScheduleCinemas([]);
  }

  function onCityChange(cityId: string) {
    if (isRental) {
      const city = rentalCityOptions.find((item) => item.value === cityId);
      setDraft((prev) => ({
        ...prev,
        cityId,
        cityName: city?.label ?? "",
        cinemaId: "",
        cinemaName: "",
        hallId: "",
        hallName: "",
        hallFormatId: "",
        hallFormatName: "",
        hallCapacity: null,
        filmId: "",
        filmName: "",
        watchCustom: "",
      }));
      return;
    }
    const city = scheduleCities.find((item) => item.value === cityId);
    setDraft((prev) => ({
      ...prev,
      cityId,
      cityName: city?.label ?? "",
      cinemaId: "",
      cinemaName: "",
      filmId: "",
      filmName: "",
      sessionId: "",
      sessionLabel: "",
    }));
  }

  function onCinemaChange(cinemaId: string) {
    if (isRental) {
      const cinema = catalogCinemas.find((item) => item.id === cinemaId);
      setDraft((prev) => ({
        ...prev,
        cinemaId,
        cinemaName: cinema?.name ?? "",
        cityId: cinema?.cityId ?? prev.cityId,
        cityName: cinema?.cityName ?? prev.cityName,
        hallId: "",
        hallName: "",
        hallFormatId: "",
        hallFormatName: "",
        hallCapacity: null,
        filmId: "",
        filmName: "",
        watchCustom: "",
      }));
      return;
    }
    const cinema = scheduleCinemas.find((item) => item.id === cinemaId);
    setDraft((prev) => ({
      ...prev,
      cinemaId,
      cinemaName: cinema?.name ?? "",
      filmId: "",
      filmName: "",
      sessionId: "",
      sessionLabel: "",
    }));
  }

  function onHallChange(hallId: string) {
    const hall = catalogHalls.find((item) => item.id === hallId);
    if (!hall) {
      setField("hallId", hallId);
      return;
    }
    setDraft((prev) => ({
      ...prev,
      hallId: hall.id,
      hallName: hall.name,
      hallFormatId: hall.format.id,
      hallFormatName: hall.format.name,
      hallCapacity: hall.capacity,
      cinemaId: hall.cinemaId,
      cinemaName: hall.cinema.name,
    }));
  }

  function onSessionChange(sessionId: string) {
    const session = sessions.find((item) => item.value === sessionId);
    setDraft((prev) => ({
      ...prev,
      sessionId,
      sessionLabel: session?.label ?? "",
    }));
  }

  const buildPayload = useCallback(() => {
    const film = draft.watchCustom
      ? catalogField("", "", "")
      : catalogField(draft.filmId, draft.filmName);

    return {
      productId: draft.productId,
      source: "admin",
      contactName: draft.contactName.trim(),
      phone: draft.phone,
      email: draft.email.trim().toLowerCase(),
      guests: draft.guests,
      ticketType: draft.ticketType,
      comment: draft.comment.trim(),
      watchCustom: draft.watchCustom.trim(),
      rentalDate: draft.rentalDate.trim(),
      rentalStart: draft.rentalStart.trim(),
      city: catalogField(draft.cityId, draft.cityName),
      cinema: catalogField(draft.cinemaId, draft.cinemaName),
      hall: catalogField(draft.hallId, draft.hallName),
      hallFormat: catalogField(draft.hallFormatId, draft.hallFormatName),
      film,
      session:
        draft.productId === "group"
          ? draft.sessionId
            ? catalogField(draft.sessionId, draft.sessionLabel)
            : catalogField("", "", "")
          : catalogField("", "", ""),
      consent: true as const,
      idempotencyKey,
      website: "",
    };
  }, [draft, idempotencyKey]);

  async function onSubmit() {
    setError("");
    setFieldErrors({});
    setSaving(true);
    try {
      const response = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = (await response.json()) as {
        item?: ApplicationRecord;
        error?: string;
        fields?: Record<string, string>;
      };
      if (!response.ok || !data.item) {
        setFieldErrors(data.fields ?? {});
        setError(
          data.error ??
            Object.values(data.fields ?? {})[0] ??
            "Не удалось создать заявку",
        );
        return;
      }
      if (draft.adminComment.trim()) {
        await fetch(`/api/admin/applications/${data.item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminComment: draft.adminComment.trim() }),
        }).catch(() => undefined);
        data.item = {
          ...data.item,
          adminComment: draft.adminComment.trim(),
        };
      }
      onCreated(data.item);
    } catch {
      setError("Нет соединения с сервером");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="my-auto w-full max-w-3xl rounded-3xl border border-line bg-card p-5 shadow-2xl outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-gold uppercase">
              Новая заявка
            </p>
            <h2
              id={titleId}
              className="mt-1 font-[family-name:var(--font-display)] text-xl sm:text-2xl"
            >
              Создать вручную
            </h2>
            <p className="mt-1 text-xs text-muted">
              Заявка появится в канбане, вы будете назначены менеджером.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1 text-sm"
            onClick={onClose}
            disabled={saving}
          >
            Закрыть
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="create-product" className="block text-xs font-medium text-muted">
              Продукт
            </label>
            <CustomSelect
              id="create-product"
              compact
              value={draft.productId}
              options={PRODUCT_IDS.map((id) => ({
                value: id,
                label: `${PRODUCT_EMOJI[id]} ${PRODUCTS[id].title}`,
              }))}
              onChange={(value) => onProductChange(value as ProductId)}
            />
          </div>

          <GuestField
            id="create-contactName"
            label="Контактное лицо"
            editing
            value={draft.contactName}
            error={fieldErrors.contactName}
            onChange={(value) => setField("contactName", value)}
          />
          <GuestField
            id="create-phone"
            label="Телефон"
            kind="phone"
            editing
            value={draft.phone}
            error={fieldErrors.phone}
            onChange={(value) => setField("phone", value)}
          />
          <GuestField
            id="create-email"
            label="Email"
            kind="email"
            editing
            value={draft.email}
            error={fieldErrors.email}
            onChange={(value) => setField("email", value)}
          />
          <GuestField
            id="create-guests"
            label="Гостей"
            kind="guests"
            editing
            value={draft.guests}
            error={fieldErrors.guests || fieldErrors["guests"]}
            onChange={(value) => setField("guests", value)}
          />

          <GuestField
            id="create-city"
            label="Город"
            editing
            kind="select"
            options={isRental ? rentalCityOptions : scheduleCities}
            value={draft.cityId}
            error={fieldErrors["city.id"]}
            onChange={onCityChange}
          />
          <GuestField
            id="create-cinema"
            label="Кинотеатр"
            editing
            kind="select"
            options={isRental ? rentalCinemaOptions : groupCinemaOptions}
            value={draft.cinemaId}
            error={fieldErrors["cinema.id"]}
            onChange={onCinemaChange}
          />

          {isRental ? (
            <GuestField
              id="create-hall"
              label="Зал"
              editing
              kind="select"
              options={rentalHallOptions}
              value={draft.hallId}
              error={fieldErrors["hall.id"] || fieldErrors["hallFormat.id"]}
              onChange={onHallChange}
            />
          ) : null}

          {draft.productId !== "event" ? (
            <div className="sm:col-span-2">
              <AdminFilmPicker
                label={draft.productId === "keys" ? "Фильм / контент" : "Фильм"}
                filmId={draft.filmId}
                filmName={draft.filmName}
                watchCustom={draft.watchCustom}
                allowCustom={draft.productId === "keys"}
                endpoint={filmEndpoint}
                onSelectFilm={(film) => {
                  setDraft((prev) => ({
                    ...prev,
                    filmId: film.id,
                    filmName: film.name,
                    watchCustom: "",
                    sessionId: "",
                    sessionLabel: "",
                  }));
                }}
                onSelectCustom={(text) => {
                  setDraft((prev) => ({
                    ...prev,
                    filmId: "",
                    filmName: "",
                    watchCustom: text,
                    sessionId: "",
                    sessionLabel: "",
                  }));
                }}
              />
              {fieldErrors["film.id"] || fieldErrors.watchCustom ? (
                <p className="mt-1 text-xs text-primary">
                  {fieldErrors["film.id"] || fieldErrors.watchCustom}
                </p>
              ) : null}
            </div>
          ) : null}

          {isGroup ? (
            <>
              <GuestField
                id="create-session"
                label="Сеанс"
                editing
                kind="select"
                options={sessions}
                value={draft.sessionId}
                error={fieldErrors["session.id"]}
                onChange={onSessionChange}
              />
              <GuestField
                id="create-ticket"
                label="Тип билета"
                editing
                kind="select"
                options={TICKET_OPTIONS}
                value={draft.ticketType}
                error={fieldErrors.ticketType}
                onChange={(value) => setField("ticketType", value)}
              />
              <div className="space-y-1">
                <label
                  htmlFor="create-rentalDate"
                  className="block text-xs font-medium text-muted"
                >
                  Дата сеанса
                </label>
                <DatePicker
                  id="create-rentalDate"
                  value={draft.rentalDate}
                  invalid={Boolean(fieldErrors.rentalDate)}
                  onChange={(value) => setField("rentalDate", value)}
                />
                {fieldErrors.rentalDate ? (
                  <p className="text-xs text-primary">{fieldErrors.rentalDate}</p>
                ) : null}
              </div>
            </>
          ) : null}

          {isRental ? (
            <div className="space-y-1 sm:col-span-2">
              <label
                htmlFor="create-rentalStart"
                className="block text-xs font-medium text-muted"
              >
                {draft.productId === "keys" ? "Дата и время сеанса" : "Дата и время"}
              </label>
              <DateTimePicker
                id="create-rentalStart"
                value={draft.rentalStart}
                invalid={Boolean(fieldErrors.rentalStart)}
                onChange={(value) => setField("rentalStart", value)}
              />
              {fieldErrors.rentalStart ? (
                <p className="text-xs text-primary">{fieldErrors.rentalStart}</p>
              ) : null}
            </div>
          ) : null}

          {draft.hallCapacity != null ? (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted">Вместимость</p>
              <p className="min-h-9 rounded-xl border border-line bg-background/60 px-3 py-2 text-sm">
                {draft.hallCapacity}
              </p>
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <GuestField
              id="create-comment"
              label="Комментарий клиента"
              editing
              multiline
              value={draft.comment}
              onChange={(value) => setField("comment", value)}
            />
          </div>
          <div className="sm:col-span-2">
            <GuestField
              id="create-adminComment"
              label="Комментарий администратора"
              editing
              multiline
              value={draft.adminComment}
              onChange={(value) => setField("adminComment", value)}
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm"
            onClick={onClose}
            disabled={saving}
          >
            Отмена
          </button>
          <button
            type="button"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            onClick={() => void onSubmit()}
          >
            {saving ? "Создаём…" : "Создать заявку"}
          </button>
        </div>
      </div>
    </div>
  );
}
