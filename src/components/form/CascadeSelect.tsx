"use client";

import { Field, inputClassName } from "@/components/form/Field";
import { CUSTOM_OPTION_ID, type ScheduleOption } from "@/lib/karo/types";

export type CascadeValue = { id: string; name: string; custom: string };

type Props = {
  label: string;
  value: CascadeValue;
  options: ScheduleOption[];
  loading?: boolean;
  disabled?: boolean;
  errorId?: string;
  errorCustom?: string;
  required?: boolean;
  allowCustom?: boolean;
  onChange: (value: CascadeValue) => void;
  id: string;
};

export function CascadeSelect({
  id,
  label,
  value,
  options,
  loading,
  disabled,
  errorId,
  errorCustom,
  required,
  allowCustom = true,
  onChange,
}: Props) {
  const isCustom = allowCustom && value.id === CUSTOM_OPTION_ID;

  return (
    <div className="space-y-3">
      <Field id={id} label={label} error={errorId} required={required}>
        <select
          id={id}
          className={inputClassName}
          value={value.id}
          disabled={disabled || loading}
          aria-invalid={Boolean(errorId)}
          aria-describedby={errorId ? `${id}-error` : undefined}
          onChange={(event) => {
            const nextId = event.target.value;
            const option = options.find((item) => item.id === nextId);
            onChange({
              id: nextId,
              name: option?.name ?? "",
              custom: nextId === CUSTOM_OPTION_ID ? value.custom : "",
            });
          }}
        >
          <option value="">
            {loading ? "Загрузка…" : "Выберите из списка"}
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>
      {isCustom ? (
        <Field
          id={`${id}-custom`}
          label="Свой вариант"
          error={errorCustom}
          required
        >
          <input
            id={`${id}-custom`}
            className={inputClassName}
            value={value.custom}
            placeholder="Введите свой вариант"
            disabled={disabled}
            aria-invalid={Boolean(errorCustom)}
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
