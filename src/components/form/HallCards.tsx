"use client";

import { formatRubles } from "@/lib/catalog/format";

export type HallCardItem = {
  id: string;
  name: string;
  capacity: number;
  rentalPriceWeekday: number;
  rentalPriceWeekend: number;
  formatName: string;
  cinemaName: string;
};

export function HallCards({
  halls,
  selectedId,
  loading,
  error,
  onSelect,
}: {
  halls: HallCardItem[];
  selectedId: string;
  loading?: boolean;
  error?: string;
  onSelect: (hall: HallCardItem | null) => void;
}) {
  if (loading) {
    return <p className="text-sm text-muted">Загружаем залы…</p>;
  }

  if (!halls.length) {
    return (
      <p className="text-sm text-muted">
        Для этого формата пока нет опубликованных залов.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Зал
        <span className="text-primary" aria-hidden="true">
          {" "}
          *
        </span>
      </p>
      <div
        className="pretty-scroll -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
        role="listbox"
        aria-label="Залы"
      >
        {halls.map((hall) => {
          const selected = hall.id === selectedId;
          return (
            <button
              key={hall.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(selected ? null : hall)}
              className={`flex w-[min(18.5rem,85vw)] shrink-0 snap-start flex-col rounded-3xl border bg-card p-4 text-left shadow-lg transition ${
                selected
                  ? "border-primary ring-1 ring-primary"
                  : "border-line hover:border-gold"
              }`}
            >
              <p className="font-semibold leading-snug">
                {hall.cinemaName} ({hall.name})
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-primary/10 px-3 py-2">
                  <p className="text-[11px] text-primary/80">Тип зала</p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {hall.formatName}
                  </p>
                </div>
                <div className="rounded-2xl bg-primary/10 px-3 py-2">
                  <p className="text-[11px] text-primary/80">Мест в зале</p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {hall.capacity}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl bg-primary/10 px-3 py-2">
                  <p className="text-[11px] text-primary/80">Стоимость аренды</p>
                  <p className="mt-1 flex flex-wrap gap-x-4 text-sm font-semibold text-primary">
                    <span>пн–пт: {formatRubles(hall.rentalPriceWeekday)}</span>
                    <span>сб–вс: {formatRubles(hall.rentalPriceWeekend)}</span>
                  </p>
                </div>
              </div>
              <span className="mt-4 flex items-center justify-between rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary">
                {selected ? "Выбран" : "Выбрать"}
                <span aria-hidden="true">›</span>
              </span>
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
