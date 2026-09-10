"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { inputClassName } from "@/components/form/Field";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function todayIso() {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatIsoDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function parseTypedDate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const ru = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  let year = 0;
  let month = 0;
  let day = 0;
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (ru) {
    day = Number(ru[1]);
    month = Number(ru[2]);
    year = Number(ru[3]);
  } else {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return toIsoDate(year, month, day);
}

function monthCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ iso: string; day: number; current: boolean }> = [];
  for (let i = 0; i < startOffset; i += 1) {
    const date = new Date(year, monthIndex, i - startOffset + 1);
    cells.push({
      iso: toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      day: date.getDate(),
      current: false,
    });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      iso: toIsoDate(year, monthIndex + 1, day),
      day,
      current: true,
    });
  }
  while (cells.length % 7 !== 0) {
    const date = new Date(year, monthIndex + 1, cells.length - startOffset - daysInMonth + 1);
    cells.push({
      iso: toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      day: date.getDate(),
      current: false,
    });
  }
  return cells;
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  markedDates,
  disabled,
  invalid,
  placeholder = "ДД.ММ.ГГГГ",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  markedDates?: string[];
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState("");
  const selected = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const marked = useMemo(() => new Set(markedDates ?? []), [markedDates]);
  const cells = useMemo(() => monthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const shown = focused ? typed : value ? formatIsoDate(value) : "";

  function showMonth(iso: string) {
    const date = new Date(`${iso}T00:00:00`);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }

  function openCalendar() {
    if (disabled) return;
    if (value) showMonth(value);
    setOpen(true);
  }

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

  function commitTyped() {
    const parsed = parseTypedDate(typed);
    if (parsed === "") {
      onChange("");
      return;
    }
    if (!parsed) {
      setTyped(value ? formatIsoDate(value) : "");
      return;
    }
    if (min && parsed < min) {
      setTyped(value ? formatIsoDate(value) : "");
      return;
    }
    onChange(parsed);
  }

  function shiftMonth(delta: number) {
    const date = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }

  return (
    <div ref={rootRef} className="relative max-w-sm">
      <div className="flex gap-2">
        <input
          id={id}
          className={inputClassName}
          value={shown}
          disabled={disabled}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={invalid || undefined}
          onFocus={() => {
            if (disabled) return;
            setTyped(value ? formatIsoDate(value) : "");
            setFocused(true);
            openCalendar();
          }}
          onChange={(event) => {
            setTyped(event.target.value);
            const parsed = parseTypedDate(event.target.value);
            if (parsed === "") onChange("");
            else if (parsed && (!min || parsed >= min)) {
              onChange(parsed);
              showMonth(parsed);
            }
          }}
          onBlur={() => {
            commitTyped();
            setFocused(false);
          }}
        />
        <button
          type="button"
          disabled={disabled}
          className="shrink-0 rounded-2xl border border-line px-3 text-gold transition hover:border-gold disabled:opacity-60"
          aria-label="Открыть календарь"
          onClick={() => {
            if (open) setOpen(false);
            else openCalendar();
          }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open ? (
        <div
          className="date-picker-popover absolute z-30 mt-2 rounded-2xl border border-line bg-card p-3 shadow-xl"
          onMouseDown={(event) => event.preventDefault()}
        >
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              className="rounded-full px-2 py-0.5 text-gold hover:bg-primary/10"
              aria-label="Предыдущий месяц"
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <p className="text-sm font-semibold">
              {MONTHS[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              className="rounded-full px-2 py-0.5 text-gold hover:bg-primary/10"
              aria-label="Следующий месяц"
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] text-muted">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell) => {
              const selectedDay = cell.iso === value;
              const today = cell.iso === todayIso();
              const markedDay = marked.has(cell.iso);
              const tooEarly = Boolean(min && cell.iso < min);
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={tooEarly}
                  className={`relative h-8 rounded-lg text-xs transition ${
                    selectedDay
                      ? "bg-primary text-white"
                      : tooEarly
                        ? "text-muted/40"
                        : cell.current
                          ? "hover:bg-primary/10"
                          : "text-muted/50 hover:bg-primary/10"
                  } ${today && !selectedDay ? "ring-1 ring-gold" : ""}`}
                  onClick={() => {
                    onChange(cell.iso);
                    setTyped(formatIsoDate(cell.iso));
                    setOpen(false);
                  }}
                >
                  {cell.day}
                  {markedDay ? (
                    <span
                      className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                        selectedDay ? "bg-white" : "bg-gold"
                      }`}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          {marked.size ? (
            <p className="mt-2 text-[11px] text-muted">Золотая точка — дни с сеансами</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function formatIsoDateTime(iso: string) {
  if (!iso) return "";
  const [datePart, timePartRaw] = iso.includes("T")
    ? iso.split("T")
    : [iso.slice(0, 10), iso.slice(11, 16)];
  const dateLabel = formatIsoDate(datePart || "");
  if (!dateLabel) return "";
  const time = (timePartRaw || "").slice(0, 5);
  return time ? `${dateLabel}, ${time}` : dateLabel;
}

export function DateTimePicker({
  id,
  value,
  onChange,
  disabled,
  invalid,
  min,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  min?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [datePart, timePartRaw] = value.includes("T")
    ? value.split("T")
    : [value.slice(0, 10), value.slice(11, 16)];
  const date = datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : "";
  const time = (timePartRaw || "").slice(0, 5);
  const selected = date ? new Date(`${date}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const cells = useMemo(() => monthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const minDate = min ?? todayIso();
  const shown = formatIsoDateTime(value);
  const hour = time.slice(0, 2) || "12";
  const minute = time.slice(3, 5) || "00";
  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")),
    [],
  );
  const minutes = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")),
    [],
  );

  function showMonth(iso: string) {
    const next = new Date(`${iso}T00:00:00`);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function openCalendar() {
    if (disabled) return;
    if (date) showMonth(date);
    setOpen(true);
  }

  function emit(nextDate: string, nextTime: string) {
    if (!nextDate) {
      onChange("");
      return;
    }
    onChange(`${nextDate}T${nextTime || "00:00"}`);
  }

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

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
    <div ref={rootRef} className="relative max-w-sm">
      <div className="flex gap-2">
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`${inputClassName} text-left ${
            shown ? "text-foreground" : "text-muted"
          }`}
          onClick={() => {
            if (open) setOpen(false);
            else openCalendar();
          }}
        >
          {shown || "ДД.ММ.ГГГГ, ЧЧ:ММ"}
        </button>
        <button
          type="button"
          disabled={disabled}
          className="shrink-0 rounded-2xl border border-line px-3 text-gold transition hover:border-gold disabled:opacity-60"
          aria-label="Выбрать дату и время"
          onClick={() => {
            if (open) setOpen(false);
            else openCalendar();
          }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open ? (
        <div className="date-picker-popover absolute z-30 mt-2 rounded-2xl border border-line bg-card p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between gap-1">
            <button
              type="button"
              className="rounded-full px-2 py-0.5 text-gold hover:bg-primary/10"
              aria-label="Предыдущий месяц"
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <p className="text-sm font-semibold">
              {MONTHS[viewMonth]} {viewYear}
            </p>
            <button
              type="button"
              className="rounded-full px-2 py-0.5 text-gold hover:bg-primary/10"
              aria-label="Следующий месяц"
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] text-muted">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((cell) => {
              const selectedDay = cell.iso === date;
              const today = cell.iso === todayIso();
              const tooEarly = Boolean(minDate && cell.iso < minDate);
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={tooEarly}
                  className={`relative h-8 rounded-lg text-xs transition ${
                    selectedDay
                      ? "bg-primary text-white"
                      : tooEarly
                        ? "text-muted/40"
                        : cell.current
                          ? "hover:bg-primary/10"
                          : "text-muted/50 hover:bg-primary/10"
                  } ${today && !selectedDay ? "ring-1 ring-gold" : ""}`}
                  onClick={() => {
                    emit(cell.iso, time || "12:00");
                    showMonth(cell.iso);
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-muted">Время</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="sr-only">Часы</span>
                <select
                  id={`${id}-hour`}
                  className={inputClassName}
                  disabled={disabled || !date}
                  value={hour}
                  onChange={(event) => {
                    if (!date) return;
                    emit(date, `${event.target.value}:${minute}`);
                  }}
                >
                  {hours.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="sr-only">Минуты</span>
                <select
                  id={`${id}-minute`}
                  className={inputClassName}
                  disabled={disabled || !date}
                  value={minutes.includes(minute) ? minute : "00"}
                  onChange={(event) => {
                    if (!date) return;
                    emit(date, `${hour}:${event.target.value}`);
                  }}
                >
                  {minutes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <button
            type="button"
            className="mt-3 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={!date}
            onClick={() => setOpen(false)}
          >
            Готово
          </button>
        </div>
      ) : null}
    </div>
  );
}

