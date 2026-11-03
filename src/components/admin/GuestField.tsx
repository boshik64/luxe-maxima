"use client";

import { useId } from "react";
import { digitsToPhone, formatPhoneDisplay } from "@/components/form/phone";
import { CustomSelect, type SelectOption } from "@/components/ui/CustomSelect";

const compactInput =
  "w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-gold disabled:opacity-60";

export function GuestField({
  id,
  label,
  value,
  editing,
  multiline,
  kind = "text",
  error,
  options,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  editing: boolean;
  multiline?: boolean;
  kind?: "text" | "phone" | "email" | "guests" | "select";
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const shown =
    kind === "select"
      ? (options?.find((item) => item.value === value)?.label ?? value)
      : kind === "phone" && value
        ? formatPhoneDisplay(value)
        : value;

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-xs font-medium text-muted">
        {label}
      </label>
      {editing ? (
        <>
          {kind === "select" ? (
            <CustomSelect
              id={fieldId}
              compact
              value={value}
              options={options ?? []}
              placeholder={placeholder ?? "Выберите"}
              invalid={Boolean(error)}
              onChange={(next) => onChange?.(next)}
            />
          ) : multiline ? (
            <textarea
              id={fieldId}
              className={`${compactInput} min-h-20`}
              value={value}
              aria-invalid={Boolean(error)}
              onChange={(event) => onChange?.(event.target.value)}
            />
          ) : (
            <input
              id={fieldId}
              className={compactInput}
              type={kind === "email" ? "email" : kind === "phone" ? "tel" : "text"}
              inputMode={kind === "guests" ? "numeric" : undefined}
              value={kind === "phone" ? formatPhoneDisplay(value || "+7") : value}
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                const raw = event.target.value;
                if (kind === "phone") onChange?.(digitsToPhone(raw));
                else if (kind === "guests") onChange?.(raw.replace(/\D/g, ""));
                else onChange?.(raw);
              }}
            />
          )}
          {error ? (
            <p className="text-xs text-primary" role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : (
        <p
          id={fieldId}
          className="min-h-9 rounded-xl border border-line bg-background/60 px-3 py-2 text-sm leading-snug whitespace-pre-wrap"
        >
          {shown.trim() ? shown : "—"}
        </p>
      )}
    </div>
  );
}
