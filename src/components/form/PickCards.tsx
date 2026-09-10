"use client";

import { type ReactNode } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useClickLock } from "@/hooks/useClickLock";

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
          ref={scrollRef}
          className="hall-cards-scroll pretty-scroll -mx-1 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-scroll px-1 pb-3"
          role="listbox"
          aria-label={label}
        >
          {children}
        </div>
        {count > 1 ? (
          <div
            className="pointer-events-none absolute top-0 right-0 bottom-3 flex w-11 items-center justify-end bg-gradient-to-l from-card via-card/80 to-transparent sm:hidden"
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
          : "w-[min(18.5rem,85vw)] flex-col bg-background/40 p-4"
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
          <div className="flex items-start gap-3">
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
            <div className="flex h-14 w-12 shrink-0 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={crestUrl!}
                alt=""
                className="max-h-14 max-w-12 object-contain"
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
          className={`mt-4 flex items-center justify-between rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.55)] ${
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
