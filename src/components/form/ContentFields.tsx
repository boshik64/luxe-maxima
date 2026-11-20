"use client";

import {
  CUSTOM_CONTENT_LABEL,
  REPERTOIRE_FILM_LABEL,
} from "@/lib/applications/display";

export function ContentFields({
  wantRepertoireFilm,
  wantCustomContent,
  errors,
  onWantRepertoireFilmChange,
  onWantCustomContentChange,
}: {
  wantRepertoireFilm: boolean;
  wantCustomContent: boolean;
  errors: Record<string, string>;
  onWantRepertoireFilmChange: (value: boolean) => void;
  onWantCustomContentChange: (value: boolean) => void;
}) {
  const contentError =
    errors.content || errors.wantRepertoireFilm || errors.wantCustomContent;

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">
        Что будете смотреть?
        <span className="text-primary" aria-hidden="true">
          {" "}
          *
        </span>
      </legend>
      <p className="text-sm text-muted">
        Можно выбрать один или оба варианта.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
            wantRepertoireFilm
              ? "border-gold bg-background/70 ring-1 ring-gold"
              : "border-line bg-background/40 hover:border-gold"
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--primary)]"
            checked={wantRepertoireFilm}
            onChange={(event) =>
              onWantRepertoireFilmChange(event.target.checked)
            }
          />
          <span>
            <span className="block font-medium text-foreground">
              {REPERTOIRE_FILM_LABEL}
            </span>
            <span className="mt-1 block text-sm text-muted">
              Конкретный фильм уточнит менеджер
            </span>
          </span>
        </label>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
            wantCustomContent
              ? "border-gold bg-background/70 ring-1 ring-gold"
              : "border-line bg-background/40 hover:border-gold"
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--primary)]"
            checked={wantCustomContent}
            onChange={(event) =>
              onWantCustomContentChange(event.target.checked)
            }
          />
          <span>
            <span className="block font-medium text-foreground">
              {CUSTOM_CONTENT_LABEL}
            </span>
            <span className="mt-1 block text-sm text-muted">
              Ролик, презентация или запись
            </span>
          </span>
        </label>
      </div>
      {contentError ? (
        <p className="text-sm text-primary" role="alert">
          {contentError}
        </p>
      ) : null}
    </fieldset>
  );
}
