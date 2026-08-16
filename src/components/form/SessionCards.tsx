"use client";

import { formatRubles } from "@/lib/catalog/format";
import { CUSTOM_OPTION_ID, type SessionOption } from "@/lib/karo/types";

function formatShowtime(showtime: string) {
  const [date, time] = showtime.split(" ");
  if (!date || !time) return "";
  return `${date.split("-").reverse().join(".")} · ${time.slice(0, 5)}`;
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
        По выбранным фильтрам сеансов нет. Можно указать своё время ниже.
      </p>
    );
  }

  const showSwipeHint = catalog.length > 1;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Сеанс
        <span className="text-primary" aria-hidden="true">
          {" "}
          *
        </span>
      </p>
      <div className="relative">
        <div
          className="hall-cards-scroll pretty-scroll -mx-1 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-scroll px-1 pb-3"
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
                className={`flex w-[min(18.5rem,85vw)] shrink-0 snap-start flex-col rounded-3xl border bg-card p-4 text-left shadow-lg transition ${
                  selected
                    ? "border-primary ring-1 ring-primary"
                    : "border-line hover:border-gold"
                }`}
              >
                <div className="flex gap-3">
                  <div className="h-[6.75rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-primary/10">
                    {session.posterUrl ? (
                      // Постер с CDN КАРО, размер заранее неизвестен.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.posterUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg font-semibold text-gold">
                        {(session.filmName || "К").slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gold">
                      {formatShowtime(session.showtime) || session.name}
                    </p>
                    <p className="mt-1 line-clamp-2 min-h-[2.5rem] font-semibold leading-snug">
                      {session.filmName || session.name}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid flex-1 grid-cols-2 gap-2">
                  <div className="flex min-h-[3.75rem] flex-col rounded-2xl bg-primary/10 px-3 py-2">
                    <p className="text-[11px] text-primary/80">Цена билета</p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {session.price != null ? formatRubles(session.price) : "—"}
                    </p>
                  </div>
                  <div className="flex min-h-[3.75rem] flex-col rounded-2xl bg-primary/10 px-3 py-2">
                    <p className="text-[11px] text-primary/80">Возраст</p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {session.ageRestriction != null
                        ? `${session.ageRestriction}+`
                        : "—"}
                    </p>
                  </div>
                  <div className="flex min-h-[3.75rem] flex-col rounded-2xl bg-primary/10 px-3 py-2">
                    <p className="text-[11px] text-primary/80">Длительность</p>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {session.duration ? `${session.duration} мин` : "—"}
                    </p>
                  </div>
                  <div className="flex min-h-[3.75rem] flex-col rounded-2xl bg-primary/10 px-3 py-2">
                    <p className="text-[11px] text-primary/80">Зал</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-primary">
                      {session.hallName || session.formatName || "—"}
                    </p>
                  </div>
                </div>
                {session.tags?.length ? (
                  <p className="mt-2 line-clamp-1 text-[11px] text-muted">
                    {session.tags.join(" · ")}
                  </p>
                ) : (
                  <p className="mt-2 min-h-[1rem]" />
                )}
                <span className="mt-3 flex items-center justify-between rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary">
                  {selected ? "Выбран" : "Выбрать"}
                  <span aria-hidden="true">›</span>
                </span>
              </button>
            );
          })}
        </div>
        {showSwipeHint ? (
          <div
            className="pointer-events-none absolute top-0 right-0 bottom-3 flex w-11 items-center justify-end bg-gradient-to-l from-background via-background/80 to-transparent sm:hidden"
            aria-hidden="true"
          >
            <span className="mr-0.5 text-2xl font-semibold text-gold">→</span>
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-primary" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
