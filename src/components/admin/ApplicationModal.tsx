"use client";

import { useEffect, useId, useRef } from "react";
import type { Application, ApplicationStatus } from "@prisma/client";
import { GuestField } from "@/components/admin/GuestField";
import { Field, inputClassName } from "@/components/form/Field";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { STATUS_LABEL } from "@/lib/admin/status";
import { PRODUCTS, TICKET_TYPES } from "@/lib/products";
import {
  validateContactName,
  validateEmailFormat,
  validateGuests,
  validateRuPhone,
} from "@/lib/validation/contact";

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
  onSave: (patch: Partial<Application>) => boolean | void | Promise<boolean | void>;
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

  const rentalValue =
    item.rentalStart && item.rentalEnd
      ? `${item.rentalStart} — ${item.rentalEnd}`
      : [item.rentalDate, item.rentalTime, item.rentalDuration]
          .filter(Boolean)
          .join(" ") || "";

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
            <CustomSelect
              id="status"
              value={item.status}
              options={Object.entries(STATUS_LABEL).map(([value, label]) => ({
                value,
                label,
              }))}
              onChange={(value) =>
                onSave({ status: value as ApplicationStatus })
              }
            />
          </Field>
          <GuestField
            id="contactName"
            label="Контактное лицо"
            value={item.contactName}
            validate={validateContactName}
            onSave={(value) => onSave({ contactName: value })}
          />
          <GuestField
            id="phone"
            label="Телефон"
            kind="phone"
            value={item.phone}
            validate={validateRuPhone}
            onSave={(value) => onSave({ phone: value })}
          />
          <GuestField
            id="email"
            label="Email"
            kind="email"
            value={item.email}
            validate={validateEmailFormat}
            onSave={(value) => onSave({ email: value })}
          />
          <GuestField
            id="cityName"
            label="Город"
            value={item.cityName}
            onSave={(value) => onSave({ cityName: value })}
          />
          <GuestField
            id="cinemaName"
            label="Кинотеатр"
            value={item.cinemaName}
            onSave={(value) => onSave({ cinemaName: value })}
          />
          <GuestField
            id="hallName"
            label="Зал"
            value={item.hallName ?? ""}
            onSave={(value) => onSave({ hallName: value })}
          />
          <GuestField
            id="hallFormatName"
            label="Формат зала"
            value={item.hallFormatName ?? ""}
            onSave={(value) => onSave({ hallFormatName: value })}
          />
          <GuestField
            id="filmName"
            label="Фильм / контент"
            value={item.filmName ?? item.watchCustom ?? ""}
            onSave={(value) => onSave({ filmName: value })}
          />
          <GuestField
            id="sessionLabel"
            label="Сеанс"
            value={item.sessionLabel || item.sessionCustom || ""}
            onSave={(value) =>
              onSave({
                sessionLabel: value,
                sessionCustom: value,
              })
            }
          />
          <GuestField
            id="guests"
            label="Гостей"
            kind="guests"
            value={item.guests != null ? String(item.guests) : ""}
            validate={validateGuests}
            onSave={(value) => onSave({ guests: Number(value) })}
          />
          <GuestField
            id="ticketType"
            label="Тип билета"
            value={
              item.ticketType
                ? (TICKET_LABEL[item.ticketType] ?? item.ticketType)
                : ""
            }
            onSave={(value) => onSave({ ticketType: value })}
          />
          {item.rentalStart || item.rentalEnd ? (
            <>
              <GuestField
                id="rentalStart"
                label="Начало аренды"
                value={item.rentalStart ?? ""}
                onSave={(value) => onSave({ rentalStart: value })}
              />
              <GuestField
                id="rentalEnd"
                label="Окончание аренды"
                value={item.rentalEnd ?? ""}
                onSave={(value) => onSave({ rentalEnd: value })}
              />
            </>
          ) : (
            <GuestField
              id="rental"
              label="Аренда"
              value={rentalValue}
              onSave={(value) => onSave({ rentalDuration: value })}
            />
          )}
          {item.hallCapacity != null ? (
            <Field id="hallCapacity" label="Вместимость">
              <p className="min-h-12 rounded-2xl border border-line bg-background/60 px-4 py-3 text-sm">
                {item.hallCapacity}
              </p>
            </Field>
          ) : null}
          {item.hallRentalPriceWeekday != null ||
          item.hallRentalPriceWeekend != null ? (
            <Field id="hallRentalPrice" label="Стоимость аренды, ₽">
              <p className="min-h-12 rounded-2xl border border-line bg-background/60 px-4 py-3 text-sm">
                пн–пт: {item.hallRentalPriceWeekday ?? item.hallRentalPrice ?? "—"}
                <br />
                сб–вс: {item.hallRentalPriceWeekend ?? "—"}
              </p>
            </Field>
          ) : item.hallRentalPrice != null ? (
            <Field id="hallRentalPrice" label="Стоимость аренды, ₽">
              <p className="min-h-12 rounded-2xl border border-line bg-background/60 px-4 py-3 text-sm">
                {item.hallRentalPrice}
              </p>
            </Field>
          ) : null}
        </div>

        <div className="mt-5">
          <GuestField
            id="comment"
            label="Комментарий клиента"
            value={item.comment ?? ""}
            multiline
            onSave={(value) => onSave({ comment: value })}
          />
        </div>

        <div className="mt-5">
          <Field id="adminComment" label="Комментарий администратора">
            <textarea
              id="adminComment"
              className={`${inputClassName} min-h-28`}
              defaultValue={item.adminComment ?? ""}
              onBlur={(event) => onSave({ adminComment: event.target.value })}
            />
          </Field>
        </div>

        {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}
        <p className="mt-3 text-sm text-muted">
          {saving
            ? "Сохраняем…"
            : "Данные гостя меняются только через карандаш. Статус и комментарий администратора — сразу."}
        </p>
      </div>
    </div>
  );
}
