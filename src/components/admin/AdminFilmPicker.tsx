"use client";

import { useEffect, useId, useRef, useState } from "react";

type FilmOption = { id: string; name: string };

const compactInput =
  "w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-gold disabled:opacity-60";

export function AdminFilmPicker({
  label,
  filmId,
  filmName,
  watchCustom,
  allowCustom,
  endpoint,
  onSelectFilm,
  onSelectCustom,
}: {
  label: string;
  filmId: string;
  filmName: string;
  watchCustom: string;
  allowCustom?: boolean;
  /** `/api/schedule/repertoire` или `/api/schedule/films?cinemaId=…` */
  endpoint: string | null;
  onSelectFilm: (film: { id: string; name: string }) => void;
  onSelectCustom: (text: string) => void;
}) {
  const fieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const locked = Boolean(filmId && filmName && !watchCustom);
  const propQuery = watchCustom || filmName;
  const [query, setQuery] = useState(propQuery);
  const [querySource, setQuerySource] = useState(propQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<FilmOption[]>([]);

  // Синхронизация с пропами без effect: при смене выбора снаружи сбрасываем локальный ввод.
  if (propQuery !== querySource) {
    setQuerySource(propQuery);
    setQuery(propQuery);
  }

  useEffect(() => {
    if (!endpoint || !open || locked) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      const joiner = endpoint.includes("?") ? "&" : "?";
      fetch(`${endpoint}${joiner}q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("films");
          const data = (await response.json()) as {
            items?: Array<{ id: string; name: string }>;
          };
          setOptions(
            (data.items ?? []).filter((item) => item.id !== "custom"),
          );
        })
        .catch((error: unknown) => {
          if ((error as { name?: string }).name !== "AbortError") setOptions([]);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [endpoint, query, open, locked]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="space-y-1 sm:col-span-2" ref={rootRef}>
      <label htmlFor={fieldId} className="block text-xs font-medium text-muted">
        {label}
      </label>
      {locked ? (
        <div className="flex items-center gap-2">
          <p className="min-h-9 flex-1 rounded-xl border border-line bg-background/60 px-3 py-2 text-sm">
            {filmName}
          </p>
          <button
            type="button"
            className="shrink-0 text-xs text-gold underline underline-offset-2"
            onClick={() => {
              onSelectFilm({ id: "", name: "" });
              setQuery("");
              setQuerySource("");
              setOpen(true);
            }}
          >
            Сменить
          </button>
        </div>
      ) : (
        <>
          <input
            id={fieldId}
            className={compactInput}
            value={query}
            placeholder={
              endpoint
                ? "Начните вводить название — как на сайте"
                : "Сначала выберите кинотеатр"
            }
            disabled={!endpoint}
            autoComplete="off"
            onFocus={() => {
              if (endpoint) setOpen(true);
            }}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              setOpen(true);
              if (filmId) onSelectFilm({ id: "", name: "" });
              if (watchCustom) onSelectCustom("");
            }}
          />
          {open && endpoint ? (
            <ul className="pretty-scroll max-h-52 overflow-auto rounded-xl border border-line bg-card py-1 shadow-xl">
              {loading ? (
                <li className="px-3 py-2 text-sm text-muted">Ищем…</li>
              ) : (
                <>
                  {options.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-muted">
                      Ничего не найдено — уточните название
                    </li>
                  ) : (
                    options.map((option) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            onSelectFilm({ id: option.id, name: option.name });
                            onSelectCustom("");
                            setQuery(option.name);
                            setQuerySource(option.name);
                            setOpen(false);
                          }}
                        >
                          {option.name}
                        </button>
                      </li>
                    ))
                  )}
                  {allowCustom ? (
                    <li>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm text-gold hover:bg-primary/10"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onSelectFilm({ id: "", name: "" });
                          onSelectCustom(query.trim() || "Свой контент");
                          setOpen(false);
                        }}
                      >
                        Свой контент
                        {query.trim() ? `: «${query.trim()}»` : ""}
                      </button>
                    </li>
                  ) : null}
                </>
              )}
            </ul>
          ) : null}
        </>
      )}
      {watchCustom ? (
        <input
          className={compactInput}
          value={watchCustom}
          placeholder="Описание своего контента"
          onChange={(event) => onSelectCustom(event.target.value)}
        />
      ) : null}
    </div>
  );
}
