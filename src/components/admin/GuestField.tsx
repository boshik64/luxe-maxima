"use client";

import { useId, useState } from "react";
import { inputClassName } from "@/components/form/Field";

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function GuestField({
  id,
  label,
  value,
  multiline,
  onSave,
}: {
  id: string;
  label: string;
  value: string;
  multiline?: boolean;
  onSave: (value: string) => void;
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function save() {
    if (draft !== value) onSave(draft);
    setEditing(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={fieldId} className="block text-sm font-medium">
          {label}
        </label>
        {editing ? null : (
          <button
            type="button"
            className="rounded-full border border-line p-1.5 text-muted transition hover:text-foreground"
            aria-label={`Изменить: ${label}`}
            onClick={startEdit}
          >
            <PencilIcon />
          </button>
        )}
      </div>
      {editing ? (
        <>
          {multiline ? (
            <textarea
              id={fieldId}
              className={`${inputClassName} min-h-28`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          ) : (
            <input
              id={fieldId}
              className={inputClassName}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white"
              onClick={save}
            >
              Сохранить
            </button>
            <button
              type="button"
              className="rounded-full border border-line px-3 py-1.5 text-sm"
              onClick={cancel}
            >
              Отмена
            </button>
          </div>
        </>
      ) : (
        <p
          id={fieldId}
          className="min-h-12 rounded-2xl border border-line bg-background/60 px-4 py-3 text-sm whitespace-pre-wrap"
        >
          {value.trim() ? value : "—"}
        </p>
      )}
    </div>
  );
}
