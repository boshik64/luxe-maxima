"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputClassName } from "@/components/form/Field";

export type SelectOption = { value: string; label: string };

export function CustomSelect({
  id,
  value,
  options,
  placeholder = "Выберите из списка",
  disabled,
  invalid,
  describedBy,
  onChange,
  className = "",
}: {
  id: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.value === value);

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
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`${inputClassName} flex items-center justify-between gap-3 text-left`}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
      >
        <span className={selected ? "" : "text-muted"}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="pretty-scroll absolute z-30 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-line bg-card py-1 shadow-xl"
        >
          {options.length === 0 ? (
            <li className="px-4 py-2 text-sm text-muted">Нет вариантов</li>
          ) : (
            options.map((option) => {
              const active = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-primary/10 ${
                      active ? "bg-primary/15 text-foreground" : ""
                    }`}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
