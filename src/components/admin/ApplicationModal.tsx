"use client";

import { useEffect, useId, useRef } from "react";
import type { Application, ApplicationStatus } from "@prisma/client";
import { Field, inputClassName } from "@/components/form/Field";
import { STATUS_LABEL } from "@/lib/admin/status";
import { PRODUCTS, TICKET_TYPES } from "@/lib/products";

const TICKET_LABEL = Object.fromEntries(
  TICKET_TYPES.map((item) => [item.value, item.label]),
);

export function ApplicationModal({
  item,
  saving,
  error,
  onClose,
  onSave,
}: {
  item: Application;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (patch: Partial<Application>) => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="my-auto w-full max-w-2xl rounded-3xl border border-line bg-card p-6 shadow-2xl outline-none sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-gold uppercase">
              {PRODUCTS[item.productId].title}
            </p>
            <h2
              id={titleId}
              className="mt-2 font-[family-name:var(--font-display)] text-2xl"
            >
              Заявка {item.id.slice(0, 8)}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Источник {item.source} · создана{" "}
              {new Date(item.createdAt).toLocaleString("ru-RU")}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1 text-sm"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field id="status" label="Статус">
            <select
              id="status"
              className={inputClassName}
              value={item.status}
              onChange={(event) =>
                onSave({ status: event.target.value as ApplicationStatus })
              }
            >
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="contactName" label="Контактное лицо">
            <input
              id="contactName"
              className={inputClassName}
              defaultValue={item.contactName}
              onBlur={(event) => onSave({ contactName: event.target.value })}
            />
          </Field>
          <Field id="phone" label="Телефон">
            <input
              id="phone"
              className={inputClassName}
              defaultValue={item.phone}
              onBlur={(event) => onSave({ phone: event.target.value })}
            />
          </Field>
          <Field id="email" label="Email">
            <input
              id="email"
              className={inputClassName}
              defaultValue={item.email}
              onBlur={(event) => onSave({ email: event.target.value })}
            />
          </Field>
          <Field id="cityName" label="Город">
            <input
              id="cityName"
              className={inputClassName}
              defaultValue={item.cityName}
              onBlur={(event) => onSave({ cityName: event.target.value })}
            />
          </Field>
          <Field id="cinemaName" label="Кинотеатр">
            <input
              id="cinemaName"
              className={inputClassName}
              defaultValue={item.cinemaName}
              onBlur={(event) => onSave({ cinemaName: event.target.value })}
            />
          </Field>
          <Field id="hallName" label="Зал">
            <input
              id="hallName"
              className={inputClassName}
              defaultValue={item.hallName ?? ""}
              onBlur={(event) => onSave({ hallName: event.target.value })}
            />
          </Field>
          <Field id="filmName" label="Фильм">
            <input
              id="filmName"
              className={inputClassName}
              defaultValue={item.filmName ?? ""}
              onBlur={(event) => onSave({ filmName: event.target.value })}
            />
          </Field>
          <Field id="sessionLabel" label="Сеанс">
            <input
              id="sessionLabel"
              className={inputClassName}
              defaultValue={item.sessionLabel || item.sessionCustom || ""}
              onBlur={(event) =>
                onSave({
                  sessionLabel: event.target.value,
                  sessionCustom: event.target.value,
                })
              }
            />
          </Field>
          <Field id="guests" label="Гостей">
            <input
              id="guests"
              className={inputClassName}
              inputMode="numeric"
              defaultValue={item.guests ?? ""}
              onBlur={(event) => {
                const guests = Number(event.target.value);
                if (Number.isInteger(guests) && guests > 0) onSave({ guests });
              }}
            />
          </Field>
          <Field id="ticketType" label="Тип билета">
            <input
              id="ticketType"
              className={inputClassName}
              defaultValue={
                item.ticketType
                  ? (TICKET_LABEL[item.ticketType] ?? item.ticketType)
                  : ""
              }
              onBlur={(event) => onSave({ ticketType: event.target.value })}
            />
          </Field>
          <Field id="rental" label="Аренда">
            <input
              id="rental"
              className={inputClassName}
              defaultValue={
                [item.rentalDate, item.rentalTime, item.rentalDuration]
                  .filter(Boolean)
                  .join(" ") || ""
              }
              onBlur={(event) => onSave({ rentalDuration: event.target.value })}
            />
          </Field>
        </div>

        <div className="mt-5">
          <Field id="comment" label="Комментарий">
            <textarea
              id="comment"
              className={`${inputClassName} min-h-28`}
              defaultValue={item.comment ?? ""}
              onBlur={(event) => onSave({ comment: event.target.value })}
            />
          </Field>
        </div>

        {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}
        <p className="mt-3 text-sm text-muted">
          {saving ? "Сохраняем…" : "Изменения пишутся при уходе с поля"}
        </p>
      </div>
    </div>
  );
}
