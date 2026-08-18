"use client";

import { useCallback, useEffect, useState } from "react";
import { Field, inputClassName } from "@/components/form/Field";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  EVENT_PROMO_MAX_INTRO,
  EVENT_PROMO_MAX_KICKER,
  EVENT_PROMO_MAX_OCCASION_BODY,
  EVENT_PROMO_MAX_OCCASION_TITLE,
  EVENT_PROMO_MAX_OCCASIONS,
  EVENT_PROMO_MAX_PRESENTATION,
  EVENT_PROMO_MAX_TITLE,
  type EventOccasion,
  type EventPromoContent,
} from "@/lib/events/types";

function linesOf(items: string[]) {
  return items.join("\n");
}

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <p className="text-xs text-muted">
      {value.length} / {max}
    </p>
  );
}

export function EventsEditor() {
  const [item, setItem] = useState<EventPromoContent | null>(null);
  const [kicker, setKicker] = useState("");
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [eventTypes, setEventTypes] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [highlights, setHighlights] = useState("");
  const [occasions, setOccasions] = useState<EventOccasion[]>([]);
  const [presentationLabel, setPresentationLabel] = useState("");
  const [presentationHref, setPresentationHref] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    return fetch("/api/admin/events").then(async (response) => {
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = (await response.json()) as {
        item?: EventPromoContent;
        error?: string;
      };
      if (!response.ok || !data.item) {
        setError(data.error ?? "Не удалось загрузить блок");
        return;
      }
      const next = data.item;
      setItem(next);
      setKicker(next.kicker);
      setTitle(next.title);
      setIntro(next.intro);
      setEventTypes(linesOf(next.eventTypes));
      setCapabilities(linesOf(next.capabilities));
      setHighlights(linesOf(next.highlights));
      setOccasions(next.occasions);
      setPresentationLabel(next.presentationLabel);
      setPresentationHref(next.presentationHref);
      setEnabled(next.enabled);
      setError("");
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить блок");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  function patchOccasion(index: number, patch: Partial<EventOccasion>) {
    setOccasions((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kicker,
        title,
        intro,
        eventTypes: eventTypes.split("\n"),
        capabilities: capabilities.split("\n"),
        highlights: highlights.split("\n"),
        occasions,
        presentationLabel,
        presentationHref,
        enabled,
      }),
    });
    const data = (await response.json()) as {
      item?: EventPromoContent;
      error?: string;
    };
    setSaving(false);
    if (!response.ok || !data.item) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    setItem(data.item);
    setNotice("Сохранено — блок на главной обновлён");
  }

  if (loading) {
    return <p className="text-sm text-muted">Загрузка…</p>;
  }

  return (
    <AdminPage
      title="Мероприятия"
      description="Тексты блока под картинками форматов на главной. Исходник — лендинг КАРО Ивент."
    >
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="grid max-w-4xl gap-6 rounded-3xl border border-line bg-card p-6 sm:p-8"
      >
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Показать блок на главной
        </label>
        <Field id="events-kicker" label="Надзаголовок">
          <input
            id="events-kicker"
            className={inputClassName}
            maxLength={EVENT_PROMO_MAX_KICKER}
            value={kicker}
            onChange={(event) => setKicker(event.target.value)}
          />
          <CharCount value={kicker} max={EVENT_PROMO_MAX_KICKER} />
        </Field>
        <Field id="events-title" label="Заголовок" required>
          <input
            id="events-title"
            className={inputClassName}
            maxLength={EVENT_PROMO_MAX_TITLE}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <CharCount value={title} max={EVENT_PROMO_MAX_TITLE} />
        </Field>
        <Field id="events-intro" label="Вступительный текст">
          <textarea
            id="events-intro"
            className={`${inputClassName} min-h-24 resize-y`}
            maxLength={EVENT_PROMO_MAX_INTRO}
            value={intro}
            onChange={(event) => setIntro(event.target.value)}
          />
          <CharCount value={intro} max={EVENT_PROMO_MAX_INTRO} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="events-types" label="Типы мероприятий (по одному в строке)">
            <textarea
              id="events-types"
              className={`${inputClassName} min-h-40 resize-y`}
              value={eventTypes}
              onChange={(event) => setEventTypes(event.target.value)}
            />
          </Field>
          <Field id="events-caps" label="Возможности (по одному в строке)">
            <textarea
              id="events-caps"
              className={`${inputClassName} min-h-40 resize-y`}
              value={capabilities}
              onChange={(event) => setCapabilities(event.target.value)}
            />
          </Field>
        </div>
        <Field id="events-highlights" label="Акценты (по одному в строке)">
          <textarea
            id="events-highlights"
            className={`${inputClassName} min-h-24 resize-y`}
            value={highlights}
            onChange={(event) => setHighlights(event.target.value)}
          />
        </Field>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg">
              Форматы вечеров
            </h2>
            <button
              type="button"
              className="rounded-full border border-line px-4 py-2 text-sm"
              disabled={occasions.length >= EVENT_PROMO_MAX_OCCASIONS}
              onClick={() =>
                setOccasions((current) =>
                  current.length >= EVENT_PROMO_MAX_OCCASIONS
                    ? current
                    : [...current, { title: "", body: "" }],
                )
              }
            >
              Добавить карточку
            </button>
          </div>
          {occasions.map((occasion, index) => (
            <div
              key={`occasion-${index}`}
              className="grid gap-4 rounded-2xl border border-line p-4"
            >
              <div className="flex justify-between gap-3">
                <p className="text-sm text-muted">Карточка {index + 1}</p>
                <button
                  type="button"
                  className="text-sm text-primary"
                  onClick={() =>
                    setOccasions((current) =>
                      current.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                >
                  Удалить
                </button>
              </div>
              <Field id={`occ-title-${index}`} label="Название">
                <input
                  id={`occ-title-${index}`}
                  className={inputClassName}
                  maxLength={EVENT_PROMO_MAX_OCCASION_TITLE}
                  value={occasion.title}
                  onChange={(event) =>
                    patchOccasion(index, { title: event.target.value })
                  }
                />
              </Field>
              <Field id={`occ-body-${index}`} label="Текст">
                <textarea
                  id={`occ-body-${index}`}
                  className={`${inputClassName} min-h-24 resize-y`}
                  maxLength={EVENT_PROMO_MAX_OCCASION_BODY}
                  value={occasion.body}
                  onChange={(event) =>
                    patchOccasion(index, { body: event.target.value })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
        <Field id="events-pdf-label" label="Текст ссылки на презентацию">
          <input
            id="events-pdf-label"
            className={inputClassName}
            maxLength={EVENT_PROMO_MAX_PRESENTATION}
            value={presentationLabel}
            onChange={(event) => setPresentationLabel(event.target.value)}
          />
          <CharCount value={presentationLabel} max={EVENT_PROMO_MAX_PRESENTATION} />
        </Field>
        <Field id="events-pdf-href" label="Ссылка на PDF">
          <input
            id="events-pdf-href"
            className={inputClassName}
            value={presentationHref}
            onChange={(event) => setPresentationHref(event.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-primary">{error}</p> : null}
        {notice ? <p className="text-sm text-gold">{notice}</p> : null}
        <button
          type="submit"
          disabled={saving || !item}
          className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
      </form>
    </AdminPage>
  );
}
