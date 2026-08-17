"use client";

import { CUSTOM_OPTION_ID, type SessionOption } from "@/lib/karo/types";

function sessionTime(session: SessionOption) {
  if (session.showtime.includes(" ")) {
    return session.showtime.split(" ")[1]?.slice(0, 5) || "";
  }
  return session.showtime.slice(11, 16);
}

export function SessionCards({
  sessions,
  selectedId,
  loading,
  error,
  onSelect,
}: {
  sessions: SessionOption[];
  selectedId: string;
  loading?: boolean;
  error?: string;
  onSelect: (session: SessionOption | null) => void;
}) {
  const catalog = sessions.filter((item) => item.id !== CUSTOM_OPTION_ID);

  if (loading) {
    return <p className="text-sm text-muted">Загружаем сеансы…</p>;
  }

  if (!catalog.length) {
    return (
      <p className="text-sm text-muted">
        На эту дату сеансов нет. Можно указать своё время ниже.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Сеанс
        <span className="text-primary" aria-hidden="true">
          {" "}
          *
        </span>
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="listbox"
        aria-label="Сеансы"
      >
        {catalog.map((session) => {
          const selected = session.id === selectedId;
          return (
            <button
              key={session.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(selected ? null : session)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-line text-muted hover:border-gold hover:text-foreground"
              }`}
            >
              <span className="font-semibold text-foreground">
                {sessionTime(session) || session.name}
              </span>
              {session.hallName ? (
                <span className="text-muted"> · {session.hallName}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm text-primary" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
