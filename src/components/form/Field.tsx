import type { ReactNode } from "react";

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

export const inputClassName =
  "w-full rounded-2xl border border-line bg-background px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-gold disabled:opacity-60";
