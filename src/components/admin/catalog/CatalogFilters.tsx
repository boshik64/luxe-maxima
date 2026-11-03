"use client";

import type { SelectOption } from "@/components/ui/CustomSelect";

export type CatalogFilterField = {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

export function CatalogFilters({ fields }: { fields: CatalogFilterField[] }) {
  if (!fields.length) return null;
  return (
    <div className="mb-5 rounded-2xl border border-line bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">Фильтры</p>
      <div className="flex flex-wrap gap-3">
        {fields.map((field) => (
          <label key={field.id} className="flex min-w-[10rem] flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">{field.label}</span>
            <select
              id={field.id}
              className="min-h-10 rounded-xl border border-line bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
            >
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}

export const PUBLISH_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "Все" },
  { value: "published", label: "Опубликовано" },
  { value: "hidden", label: "Скрыто" },
];

export function matchesPublishFilter(enabled: boolean, filter: string) {
  if (filter === "published") return enabled !== false;
  if (filter === "hidden") return enabled === false;
  return true;
}
