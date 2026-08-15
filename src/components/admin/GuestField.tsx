"use client";

import { useId, useState } from "react";
import { digitsToPhone, formatPhoneDisplay } from "@/components/form/phone";
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
  kind = "text",
  validate,
  onSave,
}: {
  id: string;
  label: string;
  value: string;
  multiline?: boolean;
  kind?: "text" | "phone" | "email" | "guests";
  validate?: (value: string) => string | null;
  onSave: (value: string) => boolean | void | Promise<boolean | void>;
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(kind === "phone" ? digitsToPhone(value || "+7") : value);
    setError("");
    setEditing(true);
  }

  function cancel() {
    setDraft(value);
    setError("");
    setEditing(false);
  }

  async function save() {
    const next =
      kind === "phone"
        ? digitsToPhone(draft)
        : kind === "email"
          ? draft.trim().toLowerCase()
          : kind === "guests"
            ? draft.replace(/\D/g, "")
            : draft.trim();
    const message = validate?.(next) ?? null;
    if (message) {
      setError(message);
      return;
    }
    if (next === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    const ok = await onSave(next);
    setSaving(false);
    if (ok === false) return;
    setEditing(false);
  }

  const shown = kind === "phone" && value ? formatPhoneDisplay(value) : value;

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
              aria-invalid={Boolean(error)}
              onChange={(event) => setDraft(event.target.value)}
            />
          ) : (
            <input
              id={fieldId}
              className={inputClassName}
              type={kind === "email" ? "email" : kind === "phone" ? "tel" : "text"}
              inputMode={kind === "guests" ? "numeric" : undefined}
              value={kind === "phone" ? formatPhoneDisplay(draft) : draft}
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                const raw = event.target.value;
                if (kind === "phone") setDraft(digitsToPhone(raw));
                else if (kind === "guests") setDraft(raw.replace(/\D/g, ""));
                else setDraft(raw);
                if (error) setError("");
              }}
            />
          )}
          {error ? (
            <p className="text-sm text-primary" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              className="rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              onClick={() => void save()}
            >
              {saving ? "Сохраняем…" : "Сохранить"}
            </button>
            <button
              type="button"
              disabled={saving}
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
          {shown.trim() ? shown : "—"}
        </p>
      )}
    </div>
  );
}
