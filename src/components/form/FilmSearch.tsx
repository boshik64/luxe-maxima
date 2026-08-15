"use client";

import { useEffect, useState } from "react";
import { Field, inputClassName } from "@/components/form/Field";
import type { CascadeValue } from "@/components/form/CascadeSelect";
import {
  CUSTOM_OPTION,
  CUSTOM_OPTION_ID,
  type ScheduleOption,
} from "@/lib/karo/types";

const emptyFilm: CascadeValue = { id: "", name: "", custom: "" };

export function FilmSearch({
  id = "film",
  label = "Фильм",
  value,
  error,
  errorCustom,
  disabled,
  required,
  allowCustom = false,
  endpoint,
  onChange,
}: {
  id?: string;
  label?: string;
  value: CascadeValue;
  error?: string;
  errorCustom?: string;
  disabled?: boolean;
  required?: boolean;
  allowCustom?: boolean;
  endpoint: string | null;
  onChange: (value: CascadeValue) => void;
}) {
  const [query, setQuery] = useState(value.name || value.custom);
  const [options, setOptions] = useState<ScheduleOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isCustom = value.id === CUSTOM_OPTION_ID;
  const canSearch = Boolean(endpoint) && !disabled && !isCustom;

  useEffect(() => {
    if (!canSearch || !endpoint) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      const joiner = endpoint.includes("?") ? "&" : "?";
      fetch(`${endpoint}${joiner}q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("films");
          const data = (await response.json()) as { items: ScheduleOption[] };
          const items = data.items.filter((item) => item.id !== CUSTOM_OPTION_ID);
          setOptions(items);
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
  }, [canSearch, endpoint, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Field id={id} label={label} required={required} error={error}>
          <input
            id={id}
            className={inputClassName}
            value={value.id && !isCustom ? value.name : query}
            disabled={disabled}
            placeholder={
              disabled ? "Сначала выберите кинотеатр" : "Начните вводить название"
            }
            autoComplete="off"
            aria-invalid={Boolean(error)}
            onFocus={() => {
              if (!disabled) setOpen(true);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              if (value.id) onChange(emptyFilm);
            }}
          />
        </Field>
        {value.id && !isCustom ? (
          <button
            type="button"
            className="mt-2 text-sm text-gold underline underline-offset-4"
            onClick={() => {
              onChange(emptyFilm);
              setQuery("");
              setOpen(false);
            }}
          >
            Сбросить фильм
          </button>
        ) : null}
        {open && canSearch && !value.id ? (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-line bg-card py-1 shadow-xl">
            {loading ? (
              <li className="px-4 py-2 text-sm text-muted">Ищем…</li>
            ) : (
              <>
                {options.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-muted">Ничего не найдено</li>
                ) : (
                  options.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onChange({
                            id: option.id,
                            name: option.name,
                            custom: "",
                          });
                          setQuery(option.name);
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
                      className="w-full px-4 py-2 text-left text-sm text-gold hover:bg-primary/10"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onChange({
                          id: CUSTOM_OPTION_ID,
                          name: CUSTOM_OPTION.name,
                          custom: query.trim(),
                        });
                        setOpen(false);
                      }}
                    >
                      {CUSTOM_OPTION.name}
                    </button>
                  </li>
                ) : null}
              </>
            )}
          </ul>
        ) : null}
      </div>
      {allowCustom && isCustom ? (
        <Field id={`${id}-custom`} label="Свой вариант" required error={errorCustom}>
          <input
            id={`${id}-custom`}
            className={inputClassName}
            value={value.custom}
            placeholder="Введите свой вариант"
            disabled={disabled}
            onChange={(event) =>
              onChange({
                id: CUSTOM_OPTION_ID,
                name: "",
                custom: event.target.value,
              })
            }
          />
        </Field>
      ) : null}
    </div>
  );
}
