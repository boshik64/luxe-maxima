"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClassName } from "@/components/form/Field";
import {
  CAROUSEL_IMAGE_SPEC,
  CAROUSEL_INTERNAL_LINKS,
  CAROUSEL_MAX_BODY,
  CAROUSEL_MAX_INTERVAL,
  CAROUSEL_MAX_KICKER,
  CAROUSEL_MAX_SLIDES,
  CAROUSEL_MAX_TITLE,
  CAROUSEL_MIN_INTERVAL,
  type CarouselLayout,
} from "@/lib/carousel/types";

type SlideItem = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  alt: string;
  layout: CarouselLayout;
  enabled: boolean;
  updatedAt: string;
};

type SlotDraft = {
  id: string | null;
  kicker: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  alt: string;
  layout: CarouselLayout;
  enabled: boolean;
  imageUrl: string;
  updatedAt: string;
  file: File | null;
};

function emptySlot(): SlotDraft {
  return {
    id: null,
    kicker: "Сезон уютных впечатлений",
    title: "",
    body: "",
    ctaLabel: "Забрать сеанс",
    ctaHref: "#form",
    alt: "",
    layout: "image-left",
    enabled: false,
    imageUrl: "",
    updatedAt: "",
    file: null,
  };
}

function itemToSlot(item: SlideItem): SlotDraft {
  return {
    id: item.id,
    kicker: item.kicker,
    title: item.title,
    body: item.body,
    ctaLabel: item.ctaLabel,
    ctaHref: item.ctaHref,
    alt: item.alt,
    layout: item.layout,
    enabled: item.enabled,
    imageUrl: item.imageUrl,
    updatedAt: item.updatedAt,
    file: null,
  };
}

function appendSlotForm(body: FormData, slot: SlotDraft) {
  if (slot.file) body.set("file", slot.file);
  body.set("kicker", slot.kicker);
  body.set("title", slot.title);
  body.set("body", slot.body);
  body.set("ctaLabel", slot.ctaLabel);
  body.set("ctaHref", slot.ctaHref);
  body.set("alt", slot.alt);
  body.set("layout", slot.layout);
  body.set("enabled", slot.enabled ? "true" : "false");
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Сервер вернул некорректный ответ");
  }
}

function LayoutPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: CarouselLayout;
  onChange: (value: CarouselLayout) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Расположение</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["image-left", "Слева картинка, справа текст"],
            ["image-right", "Слева текст, справа картинка"],
          ] as const
        ).map(([layout, label]) => (
          <label
            key={layout}
            className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm ${
              value === layout
                ? "border-primary bg-primary/10"
                : "border-line hover:border-gold"
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name={id}
              checked={value === layout}
              onChange={() => onChange(layout)}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CoverPreview({ src, emptyLabel }: { src: string; emptyLabel: string }) {
  if (!src) {
    return (
      <div className="flex aspect-[4/3] max-w-md items-center justify-center rounded-2xl border border-dashed border-line bg-background text-sm text-muted">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="aspect-[4/3] max-w-md overflow-hidden rounded-2xl border border-line bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover object-center" />
    </div>
  );
}

function SlotPreview({ slot }: { slot: SlotDraft }) {
  const objectUrl = useMemo(
    () => (slot.file ? URL.createObjectURL(slot.file) : ""),
    [slot.file],
  );
  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );
  const src =
    objectUrl || (slot.imageUrl ? `${slot.imageUrl}?v=${slot.updatedAt}` : "");
  return (
    <CoverPreview
      src={src}
      emptyLabel="Картинка подгонится под 4:3: лишнее обрежется, мелкое растянется"
    />
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const count = value.length;
  return (
    <p className={`text-xs ${count > max ? "text-primary" : "text-muted"}`}>
      {count} / {max}
    </p>
  );
}

function CtaHrefHint({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-background px-4 py-3 text-xs text-muted">
      <p>
        <strong className="font-medium text-foreground">Внутренняя</strong> — якорь
        или страница сайта, откроется здесь же.{" "}
        <strong className="font-medium text-foreground">Внешняя</strong> — полный
        адрес с https://, откроется в новой вкладке.
      </p>
      <p className="mt-2">Внутренние ссылки:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CAROUSEL_INTERNAL_LINKS.map((link) => (
          <button
            key={link.href}
            type="button"
            title={link.label}
            className={`rounded-full border px-3 py-1 ${
              value === link.href
                ? "border-primary bg-primary/10 text-foreground"
                : "border-line hover:border-gold"
            }`}
            onClick={() => onChange(link.href)}
          >
            {link.href}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CarouselEditor() {
  const router = useRouter();
  const [slots, setSlots] = useState<SlotDraft[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState(6);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    return fetch("/api/admin/carousel").then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await readJson<{
        intervalSeconds?: number;
        items?: SlideItem[];
        error?: string;
      }>(response);
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить карусель");
        return;
      }
      setIntervalSeconds(data.intervalSeconds ?? 6);
      setSlots((current) => {
        const drafts = current.filter((slot) => !slot.id);
        const saved = (data.items ?? []).map(itemToSlot);
        return [...saved, ...drafts].slice(0, CAROUSEL_MAX_SLIDES);
      });
    });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить карусель");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  function patchSlot(index: number, patch: Partial<SlotDraft>) {
    setSlots((list) =>
      list.map((slot, current) => (current === index ? { ...slot, ...patch } : slot)),
    );
  }

  async function saveInterval() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/carousel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalSeconds }),
      });
      const data = await readJson<{ intervalSeconds?: number; error?: string }>(response);
      if (!response.ok) {
        setError(data.error ?? "Не удалось сохранить интервал");
        return;
      }
      setIntervalSeconds(data.intervalSeconds ?? intervalSeconds);
      setNotice("Интервал перелистывания сохранён.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить интервал");
    } finally {
      setSaving(false);
    }
  }

  async function persistSlot(slot: SlotDraft, index: number) {
    if (!slot.id && !slot.file) {
      throw new Error(`Пост ${index + 1}: загрузите изображение`);
    }
    if (!slot.title.trim()) {
      throw new Error(`Пост ${index + 1}: укажите заголовок`);
    }
    const body = new FormData();
    appendSlotForm(body, slot);
    const response = await fetch(
      slot.id ? `/api/admin/carousel/${slot.id}` : "/api/admin/carousel",
      { method: slot.id ? "PATCH" : "POST", body },
    );
    const data = await readJson<{ item?: SlideItem; error?: string }>(response);
    if (!response.ok || !data.item) {
      throw new Error(data.error ?? `Не удалось сохранить пост ${index + 1}`);
    }
    return data.item;
  }

  async function saveSlot(index: number) {
    const slot = slots[index];
    if (!slot) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const saved = await persistSlot(slot, index);
      setSlots((list) =>
        list.map((row, current) => (current === index ? itemToSlot(saved) : row)),
      );
      setNotice(`Пост ${index + 1} сохранён. На главной он появится после публикации.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить пост");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(index: number) {
    const slot = slots[index];
    if (!slot?.id) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      body.set("enabled", slot.enabled ? "false" : "true");
      const response = await fetch(`/api/admin/carousel/${slot.id}`, {
        method: "PATCH",
        body,
      });
      const data = await readJson<{ item?: SlideItem; error?: string }>(response);
      if (!response.ok || !data.item) {
        throw new Error(data.error ?? "Не удалось изменить публикацию");
      }
      setSlots((list) =>
        list.map((row, current) => (current === index ? itemToSlot(data.item!) : row)),
      );
      setNotice(
        data.item.enabled ? "Пост опубликован на главной." : "Пост скрыт с главной.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось изменить публикацию");
    } finally {
      setSaving(false);
    }
  }

  async function removeSlide(index: number) {
    const slot = slots[index];
    if (!slot) return;
    if (slot.id) {
      if (!window.confirm("Удалить этот пост из карусели?")) return;
      setSaving(true);
      setError("");
      setNotice("");
      const response = await fetch(`/api/admin/carousel/${slot.id}`, { method: "DELETE" });
      setSaving(false);
      if (!response.ok) {
        setError("Не удалось удалить пост");
        return;
      }
      setNotice("Пост удалён.");
    }
    setSlots((list) => list.filter((_, current) => current !== index));
  }

  function addSlot() {
    if (slots.length >= CAROUSEL_MAX_SLIDES) return;
    setSlots((list) => [...list, emptySlot()]);
    setError("");
    setNotice("");
  }

  if (loading) return <p className="text-sm text-muted">Загрузка…</p>;

  const canAdd = slots.length < CAROUSEL_MAX_SLIDES;

  return (
    <div className="space-y-8">
      <section className="grid max-w-4xl gap-5 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Настройки карусели
          </h2>
          <p className="mt-2 text-sm text-muted">
            Добавляйте посты кнопкой ниже — максимум {CAROUSEL_MAX_SLIDES}. Новый пост
            сначала сохраняется как черновик и на главной не появляется. Картинка:{" "}
            {CAROUSEL_IMAGE_SPEC.label}. Порядок на сайте каждый раз случайный.
          </p>
        </div>
        <Field id="carousel-interval" label="Интервал перелистывания, секунды">
          <input
            id="carousel-interval"
            className={inputClassName}
            type="number"
            min={CAROUSEL_MIN_INTERVAL}
            max={CAROUSEL_MAX_INTERVAL}
            value={intervalSeconds}
            onChange={(event) => setIntervalSeconds(Number(event.target.value))}
          />
        </Field>
        <p className="text-xs text-muted">
          От {CAROUSEL_MIN_INTERVAL} до {CAROUSEL_MAX_INTERVAL} секунд. Стрелки на
          сайте позволяют листать вручную, не дожидаясь таймера.
        </p>
        <button
          type="button"
          disabled={saving}
          className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          onClick={() => void saveInterval()}
        >
          Сохранить интервал
        </button>
      </section>

      {slots.map((slot, index) => (
        <form
          key={slot.id ?? `new-${index}`}
          onSubmit={(event) => {
            event.preventDefault();
            void saveSlot(index);
          }}
          className="grid max-w-4xl gap-5 rounded-3xl border border-line bg-card p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-[family-name:var(--font-display)] text-lg">
              Пост {index + 1}
              {slot.id ? (slot.enabled ? " · на главной" : " · черновик") : " · новый"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {slot.id ? (
                <button
                  type="button"
                  disabled={saving}
                  className="rounded-full border border-line px-4 py-2 text-sm disabled:opacity-60"
                  onClick={() => void togglePublished(index)}
                >
                  {slot.enabled ? "Скрыть с главной" : "Показать на главной"}
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-line px-4 py-2 text-sm text-primary"
                onClick={() => void removeSlide(index)}
              >
                {slot.id ? "Удалить" : "Отменить"}
              </button>
            </div>
          </div>
          <SlotPreview slot={slot} />
          <Field id={`file-${index}`} label={slot.id ? "Заменить изображение" : "Изображение"}>
            <input
              id={`file-${index}`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              onChange={(event) =>
                patchSlot(index, { file: event.target.files?.[0] ?? null })
              }
            />
          </Field>
          <p className="text-xs text-muted">{CAROUSEL_IMAGE_SPEC.label}</p>
          <Field id={`kicker-${index}`} label="Надзаголовок">
            <input
              id={`kicker-${index}`}
              className={inputClassName}
              maxLength={CAROUSEL_MAX_KICKER}
              value={slot.kicker}
              onChange={(event) => patchSlot(index, { kicker: event.target.value })}
            />
            <CharCount value={slot.kicker} max={CAROUSEL_MAX_KICKER} />
          </Field>
          <Field id={`title-${index}`} label="Заголовок" required>
            <input
              id={`title-${index}`}
              className={inputClassName}
              maxLength={CAROUSEL_MAX_TITLE}
              value={slot.title}
              onChange={(event) => patchSlot(index, { title: event.target.value })}
            />
            <CharCount value={slot.title} max={CAROUSEL_MAX_TITLE} />
          </Field>
          <Field id={`body-${index}`} label="Текст">
            <textarea
              id={`body-${index}`}
              className={`${inputClassName} min-h-28 resize-y`}
              maxLength={CAROUSEL_MAX_BODY}
              value={slot.body}
              onChange={(event) => patchSlot(index, { body: event.target.value })}
            />
            <CharCount value={slot.body} max={CAROUSEL_MAX_BODY} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={`cta-${index}`} label="Текст кнопки">
              <input
                id={`cta-${index}`}
                className={inputClassName}
                value={slot.ctaLabel}
                onChange={(event) => patchSlot(index, { ctaLabel: event.target.value })}
              />
            </Field>
            <Field id={`href-${index}`} label="Ссылка кнопки">
              <input
                id={`href-${index}`}
                className={inputClassName}
                value={slot.ctaHref}
                placeholder="#form или https://…"
                onChange={(event) => patchSlot(index, { ctaHref: event.target.value })}
              />
            </Field>
          </div>
          <CtaHrefHint
            value={slot.ctaHref}
            onChange={(ctaHref) => patchSlot(index, { ctaHref })}
          />
          <LayoutPicker
            id={`layout-${index}`}
            value={slot.layout}
            onChange={(layout) => patchSlot(index, { layout })}
          />
          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Сохранить пост
          </button>
        </form>
      ))}

      {canAdd ? (
        <button
          type="button"
          disabled={saving}
          className="rounded-full border border-dashed border-line px-5 py-3 text-sm font-semibold disabled:opacity-60"
          onClick={addSlot}
        >
          Добавить пост
        </button>
      ) : (
        <p className="text-sm text-muted">
          Достигнут лимит в {CAROUSEL_MAX_SLIDES} постов.
        </p>
      )}

      {error ? <p className="text-sm text-primary">{error}</p> : null}
      {notice ? <p className="text-sm text-gold">{notice}</p> : null}
    </div>
  );
}
