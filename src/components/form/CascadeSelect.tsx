"use client";

import { Field, inputClassName } from "@/components/form/Field";
import { CustomSelect } from "@/components/ui/CustomSelect";
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
  const selectOptions = options.map((option) => ({
    value: option.id,
    label: option.name,
  }));

  return (
    <div className="space-y-3">
      <Field id={id} label={label} error={errorId} required={required}>
        <CustomSelect
          id={id}
          value={value.id}
          options={selectOptions}
          placeholder={loading ? "Загрузка…" : "Выберите из списка"}
          disabled={disabled || loading}
          invalid={Boolean(errorId)}
          describedBy={errorId ? `${id}-error` : undefined}
          onChange={(nextId) => {
            const option = options.find((item) => item.id === nextId);
            onChange({
              id: nextId,
              name: option?.name ?? "",
              custom: nextId === CUSTOM_OPTION_ID ? value.custom : "",
            });
          }}
        />
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
