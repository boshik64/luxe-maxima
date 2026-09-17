"use client";

import {
  type ReactNode,
  useCallback,
  useState,
  useSyncExternalStore,
} from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useClickLock } from "@/hooks/useClickLock";

function scrollRowByCard(scroller: HTMLElement, direction: 1 | -1) {
  const cards = Array.from(
    scroller.querySelectorAll<HTMLElement>('[role="option"]'),
  );
  if (!cards.length) {
    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.7, 160),
      behavior: "smooth",
    });
    return;
  }

  const left = scroller.scrollLeft;
  const target =
    direction > 0
      ? cards.find((card) => card.offsetLeft > left + 24)
      : [...cards].reverse().find((card) => card.offsetLeft < left - 8);

  if (target) {
    scroller.scrollTo({ left: Math.max(0, target.offsetLeft - 4), behavior: "smooth" });
    return;
  }

  scroller.scrollBy({
    left: direction * ((cards[0]?.offsetWidth ?? 160) + 10),
    behavior: "smooth",
  });
}

function canScrollNext(scroller: HTMLElement | null) {
  if (!scroller) return false;
  return scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > 8;
}

function useCanScrollNext(scroller: HTMLElement | null) {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (!scroller) return () => undefined;
      scroller.addEventListener("scroll", onStoreChange, { passive: true });
      const observer = new ResizeObserver(onStoreChange);
      observer.observe(scroller);
      return () => {
        scroller.removeEventListener("scroll", onStoreChange);
        observer.disconnect();
      };
    },
    () => canScrollNext(scroller),
    () => true,
  );
}

function SwipeNextButton({
  scroller,
  label,
  fadeFrom = "card",
}: {
  scroller: HTMLElement | null;
  label: string;
  fadeFrom?: "card" | "background";
}) {
  const visible = useCanScrollNext(scroller);
  const fadeClass =
    fadeFrom === "background"
      ? "from-background from-40% via-background/95"
      : "from-card from-40% via-card/95";

  if (!visible) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-y-0 -right-1 bottom-3 z-20 flex w-[4.25rem] items-center justify-end bg-gradient-to-l ${fadeClass} to-transparent sm:hidden`}
    >
      <button
        type="button"
        className="pointer-events-auto relative z-20 -mr-0.5 flex h-12 w-12 touch-manipulation items-center justify-center rounded-full border-2 border-gold bg-gold text-background shadow-[0_8px_24px_rgba(0,0,0,0.65)]"
        aria-label={`Показать ещё: ${label}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!scroller) return;
          scrollRowByCard(scroller, 1);
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 5.5 16.5 12 9 18.5"
            stroke="currentColor"
            strokeWidth="3.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export function CardRow({
  label,
  count,
  children,
  error,
}: {
  label: string;
  count: number;
  children: ReactNode;
  error?: string;
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

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        {label}
        <span className="text-primary" aria-hidden="true">
          {" "}
          *
        </span>
      </p>
      <div className="relative">
        <div
          ref={setScrollNode}
          className="hall-cards-scroll pretty-scroll -mx-1 flex snap-x snap-mandatory items-stretch gap-2.5 overflow-x-scroll px-1 pb-3"
          role="listbox"
          aria-label={label}
        >
          {children}
        </div>
        {count > 1 ? (
          <SwipeNextButton scroller={scroller} label={label} />
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

/** Кнопка «вперёд» для горизонтальных рядов карточек (мобилка). */
export function CardRowNextButton({
  scroller,
  label,
  fadeFrom = "background",
}: {
  scroller: HTMLElement | null;
  label: string;
  fadeFrom?: "card" | "background";
}) {
  return (
    <SwipeNextButton scroller={scroller} label={label} fadeFrom={fadeFrom} />
  );
}

export function PickCard({
  selected,
  title,
  lines,
  action,
  imageUrl,
  crestUrl,
  onClick,
}: {
  selected?: boolean;
  title: string;
  lines: string[];
  action: string;
  imageUrl?: string | null;
  crestUrl?: string | null;
  onClick: () => void;
}) {
  const withPoster = Boolean(imageUrl);
  const withCrest = Boolean(crestUrl) && !withPoster;
  const { run, locked } = useClickLock(2000);

  return (
    <button
      type="button"
      role="option"
      aria-selected={Boolean(selected)}
      aria-busy={locked || undefined}
      onClick={() => run(onClick)}
      className={`relative flex shrink-0 snap-start overflow-hidden rounded-3xl border text-left shadow-lg transition ${
        withPoster
          ? "aspect-[2/3] w-[min(14.5rem,72vw)] flex-col"
          : "w-[min(11.5rem,48vw)] flex-col bg-background/40 p-3"
      } ${selected ? "border-gold ring-1 ring-gold" : "border-line hover:border-gold"} ${
        locked ? "pointer-events-none opacity-80" : ""
      }`}
    >
      {withPoster ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl!}
            alt=""
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(180deg, rgba(11,7,8,0.78) 0%, rgba(11,7,8,0.28) 38%, rgba(11,7,8,0.2) 58%, rgba(11,7,8,0.82) 100%)",
            }}
            aria-hidden="true"
          />
        </>
      ) : null}
      <div
        className={`relative z-[2] flex min-w-0 flex-1 flex-col ${
          withPoster ? "justify-between p-4" : ""
        }`}
      >
        {withCrest ? (
          <div className="flex items-start gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-semibold leading-snug text-foreground">
                {title}
              </p>
              {lines.length ? (
                <div className="mt-1.5 flex flex-col gap-1">
                  {lines.map((line) => (
                    <p key={line} className="text-sm leading-snug text-muted">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex h-12 w-10 shrink-0 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={crestUrl!}
                alt=""
                className="max-h-12 max-w-10 object-contain"
              />
            </div>
          </div>
        ) : (
          <>
            <p
              className={`line-clamp-2 min-h-[2.75rem] font-semibold leading-snug text-foreground ${
                withPoster ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]" : ""
              }`}
            >
              {title}
            </p>
            {lines.length ? (
              <div className="mt-3 flex flex-1 flex-col gap-2">
                {lines.map((line) => (
                  <p
                    key={line}
                    className={`text-sm leading-snug ${
                      withPoster
                        ? "text-foreground/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"
                        : "text-muted"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </>
        )}
        <span
          className={`mt-4 flex items-center justify-between rounded-full border px-3.5 py-2 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.55)] ${
            selected
              ? "border-primary bg-primary text-white"
              : withPoster
                ? "border-white/25 bg-black/55 text-foreground backdrop-blur-sm"
                : "border-line text-foreground"
          }`}
        >
          {action}
          <span aria-hidden="true">›</span>
        </span>
      </div>
    </button>
  );
}
