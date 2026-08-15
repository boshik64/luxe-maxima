"use client";

import { FilmSearch } from "@/components/form/FilmSearch";
import type { CascadeValue } from "@/components/form/CascadeSelect";
import { Field, inputClassName } from "@/components/form/Field";

export function ContentFields({
  film,
  watchCustom,
  errors,
  onFilmChange,
  onWatchCustomChange,
}: {
  film: CascadeValue;
  watchCustom: string;
  errors: Record<string, string>;
  onFilmChange: (value: CascadeValue) => void;
  onWatchCustomChange: (value: string) => void;
}) {
  const filmDisabled = Boolean(watchCustom.trim());
  const customDisabled = Boolean(film.id);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FilmSearch
        id="film"
        label="Фильм из репертуара"
        value={film}
        error={errors["film.id"]}
        required={!customDisabled && !film.id}
        disabled={filmDisabled}
        endpoint={filmDisabled ? null : "/api/schedule/repertoire"}
        onChange={onFilmChange}
      />
      <Field
        id="watchCustom"
        label="Что будете смотреть?"
        required={!film.id && !watchCustom.trim()}
        error={errors.watchCustom}
      >
        <input
          id="watchCustom"
          className={inputClassName}
          value={watchCustom}
          disabled={customDisabled}
          placeholder="Свой контент, если не из репертуара"
          onChange={(event) => onWatchCustomChange(event.target.value)}
        />
      </Field>
    </div>
  );
}
