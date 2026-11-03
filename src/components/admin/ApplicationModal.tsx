"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ApplicationStatus } from "@prisma/client";
import { AdminFilmPicker } from "@/components/admin/AdminFilmPicker";
import { ApplicationChat } from "@/components/admin/ApplicationChat";
import { GuestField } from "@/components/admin/GuestField";
import { CustomSelect, type SelectOption } from "@/components/ui/CustomSelect";
import { PRODUCT_EMOJI } from "@/lib/admin/products";
import { STATUS_LABEL } from "@/lib/admin/status";
import {
  eventDateLabel,
  formatCreatedAt,
  publicApplicationCode,
} from "@/lib/applications/dates";
import type { ApplicationRecord } from "@/lib/applications/types";
import { PRODUCTS, TICKET_TYPES } from "@/lib/products";
import {
  validateContactName,
  validateEmailFormat,
  validateGuests,
  validateRuPhone,
} from "@/lib/validation/contact";

type CatalogCinema = {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  karoCinemaId: string;
  enabled: boolean;
};

type CatalogHall = {
  id: string;
  name: string;
  cinemaId: string;
  capacity: number;
  rentalPriceWeekday: number;
  rentalPriceWeekend: number;
  priceOnRequest?: boolean;
  format: { id: string; name: string };
  cinema: { id: string; name: string; cityName: string };
};

type GuestDraft = {
  contactName: string;
  phone: string;
  email: string;
  cityId: string;
  cityName: string;
  cinemaId: string;
  cinemaName: string;
  hallId: string;
  hallName: string;
  hallFormatName: string;
  hallCapacity: number | null;
  hallRentalPriceWeekday: number | null;
  hallRentalPriceWeekend: number | null;
  filmId: string;
  filmName: string;
  watchCustom: string;
  sessionId: string;
  sessionLabel: string;
  guests: string;
  ticketType: string;
  rentalDate: string;
  rentalStart: string;
  rentalEnd: string;
  rentalDuration: string;
  comment: string;
  adminComment: string;
};

const TICKET_OPTIONS = TICKET_TYPES.map((item) => ({
  value: item.value,
  label: item.label,
}));

function draftFromItem(item: ApplicationRecord): GuestDraft {
  const rentalDuration =
    item.rentalStart && item.rentalEnd
      ? `${item.rentalStart} — ${item.rentalEnd}`
      : [item.rentalDate, item.rentalTime, item.rentalDuration]
          .filter(Boolean)
          .join(" ") || "";

  return {
    contactName: item.contactName,
    phone: item.phone,
    email: item.email,
    cityId: item.cityId ?? "",
    cityName: item.cityName,
    cinemaId: item.cinemaId ?? "",
    cinemaName: item.cinemaName,
    hallId: item.hallId ?? "",
    hallName: item.hallName ?? "",
    hallFormatName: item.hallFormatName ?? "",
    hallCapacity: item.hallCapacity,
    hallRentalPriceWeekday: item.hallRentalPriceWeekday,
    hallRentalPriceWeekend: item.hallRentalPriceWeekend,
    filmId: item.filmId ?? "",
    filmName: item.filmName ?? "",
    watchCustom: item.watchCustom ?? "",
    sessionId: item.sessionId ?? "",
    sessionLabel: item.sessionLabel || item.sessionCustom || "",
    guests: item.guests != null ? String(item.guests) : "",
    ticketType: item.ticketType ?? "",
    rentalDate: item.rentalDate ?? "",
    rentalStart: item.rentalStart ?? "",
    rentalEnd: item.rentalEnd ?? "",
    rentalDuration,
    comment: item.comment ?? "",
    adminComment: item.adminComment ?? "",
  };
}

function optionWithCurrent(options: SelectOption[], value: string, label: string) {
  if (!value) return options;
  if (options.some((item) => item.value === value)) return options;
  return [{ value, label: label || value }, ...options];
}

export function ApplicationModal({
  item,
  saving,
  error,
  onClose,
  onSave,
  onItem,
}: {
  item: ApplicationRecord;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (
    patch: Partial<ApplicationRecord>,
  ) => boolean | void | Promise<boolean | void>;
  onItem: (item: ApplicationRecord) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(item);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => draftFromItem(item));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [localSaving, setLocalSaving] = useState(false);

  const [catalogCinemas, setCatalogCinemas] = useState<CatalogCinema[]>([]);
  const [catalogHalls, setCatalogHalls] = useState<CatalogHall[]>([]);
  const [scheduleCities, setScheduleCities] = useState<SelectOption[]>([]);
  const [scheduleCinemas, setScheduleCinemas] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [sessions, setSessions] = useState<SelectOption[]>([]);

  const isRental = current.productId === "keys" || current.productId === "event";
  const isGroup = current.productId === "group";

  const [trackedItem, setTrackedItem] = useState(item);
  if (item !== trackedItem) {
    setTrackedItem(item);
    setCurrent(item);
    if (!editing) setDraft(draftFromItem(item));
  }

  if (editing && isRental && catalogCinemas.length > 0 && draft.cinemaId) {
    const cinema = catalogCinemas.find((entry) => entry.id === draft.cinemaId);
    if (
      cinema &&
      (draft.cityId !== cinema.cityId ||
        draft.cityName !== cinema.cityName ||
        draft.cinemaName !== cinema.name)
    ) {
      setDraft((prev) => ({
        ...prev,
        cityId: cinema.cityId,
        cityName: cinema.cityName,
        cinemaName: cinema.name,
      }));
    }
  }

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (editing) {
          setEditing(false);
          setDraft(draftFromItem(current));
          setFieldErrors({});
          return;
        }
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, editing, current]);

  useEffect(() => {
    if (editing) return;
    let cancelled = false;
    async function refresh() {
      const response = await fetch(`/api/admin/applications/${item.id}`);
      const data = (await response.json()) as { item?: ApplicationRecord };
      if (!cancelled && data.item) {
        setCurrent(data.item);
        onItem(data.item);
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [item.id, onItem, editing]);

  useEffect(() => {
    if (!editing) return;
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
      if (isGroup || current.productId === "keys") {
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
  }, [editing, isRental, isGroup, current.productId]);

  const rentalCityOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const cinema of catalogCinemas) {
      if (!map.has(cinema.cityId)) map.set(cinema.cityId, cinema.cityName);
    }
    const options = [...map.entries()].map(([value, label]) => ({ value, label }));
    return optionWithCurrent(options, draft.cityId, draft.cityName);
  }, [catalogCinemas, draft.cityId, draft.cityName]);

  const rentalCinemaOptions = useMemo(() => {
    const options = catalogCinemas
      .filter((cinema) => !draft.cityId || cinema.cityId === draft.cityId)
      .map((cinema) => ({ value: cinema.id, label: cinema.name }));
    return optionWithCurrent(options, draft.cinemaId, draft.cinemaName);
  }, [catalogCinemas, draft.cityId, draft.cinemaId, draft.cinemaName]);

  const rentalHallOptions = useMemo(() => {
    const options = catalogHalls
      .filter((hall) => !draft.cinemaId || hall.cinemaId === draft.cinemaId)
      .map((hall) => ({
        value: hall.id,
        label: `${hall.name} · ${hall.format.name}`,
      }));
    return optionWithCurrent(
      options,
      draft.hallId,
      draft.hallName
        ? `${draft.hallName}${draft.hallFormatName ? ` · ${draft.hallFormatName}` : ""}`
        : "",
    );
  }, [
    catalogHalls,
    draft.cinemaId,
    draft.hallId,
    draft.hallName,
    draft.hallFormatName,
  ]);

  const groupCinemaOptions = useMemo(() => {
    const options = scheduleCinemas.map((cinema) => ({
      value: cinema.id,
      label: cinema.name,
    }));
    return optionWithCurrent(options, draft.cinemaId, draft.cinemaName);
  }, [scheduleCinemas, draft.cinemaId, draft.cinemaName]);

  const sessionOptions = useMemo(
    () => optionWithCurrent(sessions, draft.sessionId, draft.sessionLabel),
    [sessions, draft.sessionId, draft.sessionLabel],
  );

  const loadScheduleCinemas = useCallback(async (cityId: string) => {
    if (!cityId) {
      setScheduleCinemas([]);
      return;
    }
    const response = await fetch(`/api/schedule/cinemas?cityId=${cityId}`);
    const data = (await response.json()) as {
      items?: Array<{ id: string; name: string }>;
    };
    setScheduleCinemas(
      (data.items ?? []).filter((cinema) => cinema.id !== "custom"),
    );
  }, []);

  const loadSessions = useCallback(async (cinemaId: string, filmId: string) => {
    if (!cinemaId || !filmId || !/^\d+$/.test(cinemaId)) {
      setSessions([]);
      return;
    }
    const params = new URLSearchParams({ cinemaId, filmId });
    const response = await fetch(`/api/schedule/sessions?${params}`);
    const data = (await response.json()) as {
      items?: Array<{ id: string; name: string }>;
    };
    setSessions(
      (data.items ?? [])
        .filter((session) => session.id !== "custom")
        .map((session) => ({ value: session.id, label: session.name })),
    );
  }, []);

  useEffect(() => {
    if (!editing || !isGroup) return;
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
  }, [editing, isGroup, draft.cityId]);

  useEffect(() => {
    if (!editing || !isGroup) return;
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
  }, [editing, isGroup, draft.cinemaId, draft.filmId]);

  const filmEndpoint =
    current.productId === "keys"
      ? "/api/schedule/repertoire"
      : isGroup && draft.cinemaId && /^\d+$/.test(draft.cinemaId)
        ? `/api/schedule/films?cinemaId=${draft.cinemaId}`
        : null;

  function setField<K extends keyof GuestDraft>(key: K, value: GuestDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function startEdit() {
    setDraft(draftFromItem(current));
    setFieldErrors({});
    setEditing(true);
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
        hallFormatName: "",
        hallCapacity: null,
        hallRentalPriceWeekday: null,
        hallRentalPriceWeekend: null,
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
    void loadScheduleCinemas(cityId);
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
        hallFormatName: "",
        hallCapacity: null,
        hallRentalPriceWeekday: null,
        hallRentalPriceWeekend: null,
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
      hallFormatName: hall.format.name,
      hallCapacity: hall.capacity,
      hallRentalPriceWeekday: hall.rentalPriceWeekday,
      hallRentalPriceWeekend: hall.rentalPriceWeekend,
      cinemaId: hall.cinemaId,
      cinemaName: hall.cinema.name,
    }));
  }

  function onSessionChange(sessionId: string) {
    const session = sessionOptions.find((item) => item.value === sessionId);
    setDraft((prev) => ({
      ...prev,
      sessionId,
      sessionLabel: session?.label ?? "",
    }));
  }

  async function saveGuestData() {
    const nextErrors: Record<string, string> = {};
    const nameError = validateContactName(draft.contactName);
    if (nameError) nextErrors.contactName = nameError;
    const phoneError = validateRuPhone(draft.phone);
    if (phoneError) nextErrors.phone = phoneError;
    const emailError = validateEmailFormat(draft.email);
    if (emailError) nextErrors.email = emailError;
    if (draft.guests) {
      const guestsError = validateGuests(draft.guests);
      if (guestsError) nextErrors.guests = guestsError;
    }
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    const patch: Partial<ApplicationRecord> = {
      contactName: draft.contactName.trim(),
      phone: draft.phone,
      email: draft.email.trim().toLowerCase(),
      cityId: draft.cityId || null,
      cityName: draft.cityName.trim(),
      cinemaId: draft.cinemaId || null,
      cinemaName: draft.cinemaName.trim(),
      hallId: draft.hallId || null,
      hallName: draft.hallName.trim(),
      hallFormatName: draft.hallFormatName.trim(),
      hallCapacity: draft.hallCapacity,
      hallRentalPriceWeekday: draft.hallRentalPriceWeekday,
      hallRentalPriceWeekend: draft.hallRentalPriceWeekend,
      hallRentalPrice: draft.hallRentalPriceWeekday,
      filmId: draft.watchCustom ? null : draft.filmId || null,
      filmName: draft.watchCustom ? draft.watchCustom.trim() : draft.filmName.trim(),
      watchCustom: draft.watchCustom.trim() || null,
      sessionId: draft.sessionId || null,
      sessionLabel: draft.sessionLabel.trim(),
      sessionCustom: draft.sessionLabel.trim(),
      ticketType: draft.ticketType.trim() || null,
      comment: draft.comment.trim(),
      adminComment: draft.adminComment,
    } as Partial<ApplicationRecord>;

    if (draft.guests) patch.guests = Number(draft.guests);
    if (current.productId === "group") {
      patch.rentalDate = draft.rentalDate.trim();
    } else if (current.productId === "event" || current.rentalStart) {
      patch.rentalStart = draft.rentalStart.trim();
      if (draft.rentalEnd) patch.rentalEnd = draft.rentalEnd.trim();
    } else if (draft.rentalDuration) {
      patch.rentalDuration = draft.rentalDuration.trim();
    }

    setLocalSaving(true);
    const ok = await onSave(patch);
    setLocalSaving(false);
    if (ok === false) return;
    setEditing(false);
    setFieldErrors({});
  }

  const busy = saving || localSaving;
  const viewTicket =
    current.ticketType
      ? (TICKET_TYPES.find((item) => item.value === current.ticketType)?.label ??
        current.ticketType)
      : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !editing) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="my-auto w-full max-w-6xl rounded-3xl border border-line bg-card p-5 shadow-2xl outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-gold uppercase">
              <span aria-hidden="true">{PRODUCT_EMOJI[current.productId]}</span>{" "}
              {PRODUCTS[current.productId].title}
            </p>
            <h2
              id={titleId}
              className="mt-1 font-[family-name:var(--font-display)] text-xl sm:text-2xl"
            >
              Заявка {publicApplicationCode(current.publicNumber)}
            </h2>
            <p className="mt-1 text-xs text-muted">
              Создана {formatCreatedAt(current.createdAt)}
              {eventDateLabel(current) ? ` · мероприятие ${eventDateLabel(current)}` : ""}
              {" · "}
              {current.manager?.name ?? "без менеджера"}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                  onClick={() => void saveGuestData()}
                >
                  {busy ? "Сохраняем…" : "Сохранить"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-full border border-line px-3 py-1 text-sm"
                  onClick={() => {
                    setEditing(false);
                    setDraft(draftFromItem(current));
                    setFieldErrors({});
                  }}
                >
                  Отмена
                </button>
              </>
            ) : (
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1 text-sm"
                onClick={startEdit}
              >
                Изменить данные
              </button>
            )}
            <button
              type="button"
              className="rounded-full border border-line px-3 py-1 text-sm"
              onClick={onClose}
            >
              Закрыть
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="status" className="block text-xs font-medium text-muted">
                  Статус
                </label>
                <CustomSelect
                  id="status"
                  compact
                  value={current.status}
                  options={Object.entries(STATUS_LABEL).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  onChange={(value) =>
                    onSave({ status: value as ApplicationStatus })
                  }
                />
              </div>
              <GuestField
                id="contactName"
                label="Контактное лицо"
                editing={editing}
                value={editing ? draft.contactName : current.contactName}
                error={fieldErrors.contactName}
                onChange={(value) => setField("contactName", value)}
              />
              <GuestField
                id="phone"
                label="Телефон"
                kind="phone"
                editing={editing}
                value={editing ? draft.phone : current.phone}
                error={fieldErrors.phone}
                onChange={(value) => setField("phone", value)}
              />
              <GuestField
                id="email"
                label="Email"
                kind="email"
                editing={editing}
                value={editing ? draft.email : current.email}
                error={fieldErrors.email}
                onChange={(value) => setField("email", value)}
              />

              <GuestField
                id="cityName"
                label="Город"
                editing={editing}
                kind={editing ? "select" : "text"}
                options={isRental ? rentalCityOptions : scheduleCities}
                value={
                  editing
                    ? draft.cityId || draft.cityName
                    : current.cityName
                }
                onChange={(value) => {
                  if (editing && (isRental ? rentalCityOptions : scheduleCities).some((o) => o.value === value)) {
                    onCityChange(value);
                  } else {
                    setField("cityName", value);
                  }
                }}
              />
              <GuestField
                id="cinemaName"
                label="Кинотеатр"
                editing={editing}
                kind={editing ? "select" : "text"}
                options={isRental ? rentalCinemaOptions : groupCinemaOptions}
                value={
                  editing
                    ? draft.cinemaId || draft.cinemaName
                    : current.cinemaName
                }
                onChange={(value) => {
                  const options = isRental ? rentalCinemaOptions : groupCinemaOptions;
                  if (editing && options.some((o) => o.value === value)) {
                    onCinemaChange(value);
                  } else {
                    setField("cinemaName", value);
                  }
                }}
              />

              {isRental || current.hallName ? (
                <GuestField
                  id="hallName"
                  label="Зал"
                  editing={editing}
                  kind={editing && isRental ? "select" : "text"}
                  options={rentalHallOptions}
                  value={
                    editing
                      ? draft.hallId || draft.hallName
                      : current.hallName
                        ? `${current.hallName}${current.hallFormatName ? ` · ${current.hallFormatName}` : ""}`
                        : ""
                  }
                  onChange={(value) => {
                    if (editing && isRental && rentalHallOptions.some((o) => o.value === value)) {
                      onHallChange(value);
                    } else {
                      setField("hallName", value);
                    }
                  }}
                />
              ) : null}

              {current.productId !== "event" ? (
                editing ? (
                  <AdminFilmPicker
                    label={
                      current.productId === "keys" ? "Фильм / контент" : "Фильм"
                    }
                    filmId={draft.filmId}
                    filmName={draft.filmName}
                    watchCustom={draft.watchCustom}
                    allowCustom={current.productId === "keys"}
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
                      if (isGroup && draft.cinemaId && film.id) {
                        void loadSessions(draft.cinemaId, film.id);
                      }
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
                ) : (
                  <GuestField
                    id="filmName"
                    label={
                      current.productId === "keys" ? "Фильм / контент" : "Фильм"
                    }
                    editing={false}
                    value={current.watchCustom || current.filmName || ""}
                  />
                )
              ) : null}

              {isGroup || current.sessionLabel || current.sessionCustom ? (
                <GuestField
                  id="sessionLabel"
                  label="Сеанс"
                  editing={editing}
                  kind={editing && isGroup ? "select" : "text"}
                  options={sessionOptions}
                  value={
                    editing
                      ? draft.sessionId || draft.sessionLabel
                      : current.sessionLabel || current.sessionCustom || ""
                  }
                  onChange={(value) => {
                    if (editing && isGroup && sessionOptions.some((o) => o.value === value)) {
                      onSessionChange(value);
                    } else {
                      setField("sessionLabel", value);
                    }
                  }}
                />
              ) : null}

              <GuestField
                id="guests"
                label="Гостей"
                kind="guests"
                editing={editing}
                value={
                  editing
                    ? draft.guests
                    : current.guests != null
                      ? String(current.guests)
                      : ""
                }
                error={fieldErrors.guests}
                onChange={(value) => setField("guests", value)}
              />

              {isGroup || current.ticketType ? (
                <GuestField
                  id="ticketType"
                  label="Тип билета"
                  editing={editing}
                  kind={editing ? "select" : "text"}
                  options={TICKET_OPTIONS}
                  value={editing ? draft.ticketType : viewTicket}
                  onChange={(value) => setField("ticketType", value)}
                />
              ) : null}

              {current.productId === "group" || current.rentalDate ? (
                <GuestField
                  id="rentalDate"
                  label="Дата сеанса"
                  editing={editing}
                  value={editing ? draft.rentalDate : (current.rentalDate ?? "")}
                  onChange={(value) => setField("rentalDate", value)}
                />
              ) : null}

              {current.productId === "event" || current.rentalStart ? (
                <GuestField
                  id="rentalStart"
                  label="Дата и время"
                  editing={editing}
                  value={
                    editing ? draft.rentalStart : (current.rentalStart ?? "")
                  }
                  onChange={(value) => setField("rentalStart", value)}
                />
              ) : null}

              {(editing ? draft.hallCapacity : current.hallCapacity) != null ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted">Вместимость</p>
                  <p className="min-h-9 rounded-xl border border-line bg-background/60 px-3 py-2 text-sm">
                    {editing ? draft.hallCapacity : current.hallCapacity}
                  </p>
                </div>
              ) : null}

              {(editing
                ? draft.hallRentalPriceWeekday != null ||
                  draft.hallRentalPriceWeekend != null
                : current.hallRentalPriceWeekday != null ||
                  current.hallRentalPriceWeekend != null) ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted">Стоимость аренды, ₽</p>
                  <p className="min-h-9 rounded-xl border border-line bg-background/60 px-3 py-2 text-sm leading-snug">
                    пн–чт:{" "}
                    {(editing
                      ? draft.hallRentalPriceWeekday
                      : current.hallRentalPriceWeekday) ??
                      current.hallRentalPrice ??
                      "—"}
                    <br />
                    пт–вс:{" "}
                    {(editing
                      ? draft.hallRentalPriceWeekend
                      : current.hallRentalPriceWeekend) ?? "—"}
                  </p>
                </div>
              ) : null}
            </div>

            <GuestField
              id="comment"
              label="Комментарий клиента"
              editing={editing}
              value={editing ? draft.comment : (current.comment ?? "")}
              multiline
              onChange={(value) => setField("comment", value)}
            />

            <div className="space-y-1">
              <label
                htmlFor="adminComment"
                className="block text-xs font-medium text-muted"
              >
                Комментарий администратора
              </label>
              <textarea
                id="adminComment"
                className="min-h-20 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-gold"
                value={editing ? draft.adminComment : (current.adminComment ?? "")}
                onChange={(event) => {
                  if (editing) setField("adminComment", event.target.value);
                }}
                onBlur={(event) => {
                  if (!editing) {
                    onSave({ adminComment: event.target.value });
                  }
                }}
              />
            </div>
          </div>

          <ApplicationChat
            item={current}
            onUpdated={(next) => {
              setCurrent(next);
              onItem(next);
            }}
          />
        </div>

        {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
        <p className="mt-2 text-xs text-muted">
          {busy
            ? "Сохраняем…"
            : editing
              ? "Город, кинотеатр, зал и фильм — из списков. Нажмите «Сохранить»."
              : "«Изменить данные» открывает поля. Статус сохраняется сразу."}
        </p>
      </div>
    </div>
  );
}
