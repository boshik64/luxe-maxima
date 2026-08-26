"use client";

import { useEffect, useId, useState } from "react";
import { GROUP_TICKET_TERMS } from "@/lib/products";

function InfoGlyph() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 10.5v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function GroupTerms({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="mt-6 inline-flex items-center gap-2 text-left text-sm text-gold underline-offset-4 transition hover:text-foreground hover:underline"
        onClick={() => setOpen(true)}
      >
        <InfoGlyph />
        <span className="underline">{label}</span>
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[min(32rem,80vh)] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-card p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id={titleId}
                className="flex items-start gap-2 font-[family-name:var(--font-display)] text-lg"
              >
                <InfoGlyph />
                <span>{label}</span>
              </h2>
              <button
                type="button"
                className="rounded-full px-2 text-xl leading-none text-muted hover:text-foreground"
                aria-label="Закрыть"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
              {GROUP_TICKET_TERMS.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
