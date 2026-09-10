"use client";

import { type ReactNode, useEffect, useRef } from "react";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({ id, label, error, required, children }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required ? (
          <span className="text-primary" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True if the step is already on screen enough that scrolling would only annoy. */
function isComfortablyVisible(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  // Top is in the upper ~70% of the viewport and some of the block is visible.
  return rect.top >= 0 && rect.top <= vh * 0.7 && rect.bottom > 80;
}

export function FormStep({
  show,
  children,
  variant = "row",
  scrollOnShow = true,
}: {
  show: boolean;
  children: ReactNode;
  variant?: "row" | "contacts";
  /** Scroll the step into view when it first appears (false→true). */
  scrollOnShow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wasShown = useRef(false);

  useEffect(() => {
    if (!show) {
      wasShown.current = false;
      return;
    }
    if (!scrollOnShow || wasShown.current) {
      wasShown.current = true;
      return;
    }
    wasShown.current = true;

    const node = ref.current;
    if (!node) return;

    const delay = prefersReducedMotion() ? 0 : 280;
    const timer = window.setTimeout(() => {
      if (isComfortablyVisible(node)) return;
      node.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [show, scrollOnShow]);

  if (!show) return null;
  return (
    <div
      ref={ref}
      className={variant === "contacts" ? "form-step form-step-contacts" : "form-step"}
    >
      {children}
    </div>
  );
}

export const inputClassName =
  "w-full rounded-2xl border border-line bg-background px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-gold disabled:opacity-60";
