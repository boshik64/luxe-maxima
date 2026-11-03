"use client";

import { useCallback, useState } from "react";
import { CardRowNextButton } from "@/components/form/PickCards";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useClickLock } from "@/hooks/useClickLock";
import {
  CONSOLE_GAMING_LABEL,
  formatRubles,
  HALL_PRICE_WEEKDAY_LABEL,
  HALL_PRICE_WEEKEND_LABEL,
} from "@/lib/catalog/format";

export type HallCardItem = {
  id: string;
  name: string;
  capacity: number;
  rentalPriceWeekday: number;
  rentalPriceWeekend: number;
  priceOnRequest?: boolean;
  consoleGaming?: boolean;
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
  const scrollRef = useDragScroll<HTMLDivElement>();
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const setScrollNode = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      setScroller((prev) => (prev === node ? prev : node));
    },
    [scrollRef],
  );

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

  const showSwipeHint = halls.length > 1;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Зал
        <span className="text-primary" aria-hidden="true">
          {" "}
          *
        </span>
      </p>
      <div className="relative">
        <div
          ref={setScrollNode}
          className="hall-cards-scroll pretty-scroll -mx-1 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-scroll px-1 pb-3"
          role="listbox"
          aria-label="Залы"
        >
          {halls.map((hall) => (
            <HallCardButton
              key={hall.id}
              hall={hall}
              selected={hall.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
        {showSwipeHint ? (
          <CardRowNextButton scroller={scroller} label="Зал" fadeFrom="background" />
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

function HallCardButton({
  hall,
  selected,
  onSelect,
}: {
  hall: HallCardItem;
  selected: boolean;
  onSelect: (hall: HallCardItem | null) => void;
}) {
  const { run, locked } = useClickLock(2000);

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-busy={locked || undefined}
      onClick={() => run(() => onSelect(selected ? null : hall))}
      className={`flex w-[min(18.5rem,85vw)] shrink-0 snap-start flex-col rounded-3xl border bg-card p-4 text-left shadow-lg transition ${
        selected
          ? "border-gold ring-1 ring-gold"
          : "border-line hover:border-gold"
      } ${locked ? "pointer-events-none opacity-80" : ""}`}
    >
      <p className="line-clamp-2 min-h-[2.75rem] font-semibold leading-snug text-foreground">
        {hall.cinemaName} ({hall.name})
      </p>
      {hall.consoleGaming ? (
        <p className="console-gaming-sticker mt-3 inline-flex max-w-full items-center gap-2.5 px-3.5 py-2 text-[13px] font-bold tracking-wide uppercase">
          <GamepadIcon />
          <span className="console-gaming-sticker__label">{CONSOLE_GAMING_LABEL}</span>
        </p>
      ) : null}
      <div className="mt-3 grid flex-1 grid-cols-2 gap-2">
        <div className="flex min-h-[4.5rem] flex-col rounded-2xl bg-white/[0.04] px-3 py-2">
          <p className="text-[11px] text-gold">Тип зала</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
            {hall.formatName}
          </p>
        </div>
        <div className="flex min-h-[4.5rem] flex-col rounded-2xl bg-white/[0.04] px-3 py-2">
          <p className="text-[11px] text-gold">Мест в зале</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {hall.capacity}
          </p>
        </div>
        <div className="col-span-2 flex min-h-[4.25rem] flex-col rounded-2xl bg-white/[0.04] px-3 py-2">
          <p className="text-[11px] text-gold">Стоимость аренды</p>
          <p className="mt-1 flex flex-wrap gap-x-4 text-sm font-semibold text-foreground">
            {hall.priceOnRequest ? (
              <span>по запросу</span>
            ) : (
              <>
                <span>
                  {HALL_PRICE_WEEKDAY_LABEL}: {formatRubles(hall.rentalPriceWeekday)}
                </span>
                <span>
                  {HALL_PRICE_WEEKEND_LABEL}: {formatRubles(hall.rentalPriceWeekend)}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
      <span
        className={`mt-4 flex items-center justify-between rounded-full border px-4 py-2 text-sm font-semibold ${
          selected
            ? "border-primary bg-primary text-white"
            : "border-line text-foreground"
        }`}
      >
        {selected ? "Выбран" : "Выбрать"}
        <span aria-hidden="true">›</span>
      </span>
    </button>
  );
}

function GamepadIcon() {
  return (
    <svg
      className="console-gaming-sticker__icon shrink-0"
      width="28"
      height="20"
      viewBox="0 0 56 40"
      fill="none"
      aria-hidden="true"
    >
      {/* DualSense / PS silhouette */}
      <path
        d="M14.5 8.5c2.2-3.2 5.4-5 9.2-5h8.6c3.8 0 7 1.8 9.2 5l1.4 2.1c.6.9 1.5 1.5 2.5 1.7l4.6.9c2.6.5 4.5 2.7 4.5 5.4v3.2c0 3.8-2.6 7.1-6.3 7.9l-3.1.7c-1.4.3-2.6 1.2-3.3 2.5-.9 1.7-2.6 2.8-4.6 2.8H18.8c-2 0-3.7-1.1-4.6-2.8-.7-1.3-1.9-2.2-3.3-2.5l-3.1-.7C4.1 28.9 1.5 25.6 1.5 21.8v-3.2c0-2.7 1.9-4.9 4.5-5.4l4.6-.9c1-.2 1.9-.8 2.5-1.7l1.4-2.1Z"
        fill="currentColor"
        stroke="#1a1208"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Touchpad */}
      <rect
        x="21.5"
        y="11.5"
        width="13"
        height="7"
        rx="1.6"
        fill="#1a1208"
        opacity="0.85"
      />
      {/* D-pad */}
      <path
        d="M12.2 19.2h2.4v2.4h2.4v2.4h-2.4v2.4h-2.4v-2.4H9.8v-2.4h2.4v-2.4Z"
        fill="#1a1208"
      />
      {/* PS face buttons: △ ○ ✕ □ */}
      <path
        d="M40.2 16.6 42 13.4l1.8 3.2H40.2Z"
        fill="#1a1208"
      />
      <circle cx="45.6" cy="20.2" r="1.55" stroke="#1a1208" strokeWidth="1.4" fill="none" />
      <path
        d="M40.4 26.6 42.2 24.8M42.2 26.6 40.4 24.8"
        stroke="#1a1208"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect
        x="35.3"
        y="18.5"
        width="3.1"
        height="3.1"
        rx="0.4"
        transform="rotate(45 36.85 20.05)"
        stroke="#1a1208"
        strokeWidth="1.3"
        fill="none"
      />
      {/* Analog sticks */}
      <circle cx="20.2" cy="27.2" r="2.35" fill="#1a1208" />
      <circle cx="35.8" cy="27.2" r="2.35" fill="#1a1208" />
    </svg>
  );
}
