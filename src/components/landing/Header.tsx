"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useWinterEffects } from "@/components/landing/WinterEffects";
import { KARO_SITE_URL } from "@/lib/contacts";

function SnowflakeIcon({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      <path d="M12 2v20M4.5 6.5l15 11M4.5 17.5l15-11" />
      <path d="M12 6.2l2.2-2.2M12 6.2l-2.2-2.2M12 17.8l2.2 2.2M12 17.8l-2.2 2.2" />
      <path d="M7.2 8.4l-3 .4M7.2 8.4l.4-3M16.8 15.6l3-.4M16.8 15.6l-.4 3" />
      <path d="M7.2 15.6l-3-.4M7.2 15.6l.4 3M16.8 8.4l3 .4M16.8 8.4l-.4-3" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" opacity={on ? 1 : 0.45} />
    </svg>
  );
}

export function Header() {
  const { available, enabled, toggle } = useWinterEffects();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <a
          href={KARO_SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground"
          aria-label="Сайт КАРО"
        >
          <Logo />
        </a>
        <nav aria-label="Основная навигация" className="flex items-center gap-3">
          {available ? (
            <button
              type="button"
              className={`winter-fx-toggle ${enabled ? "is-on" : ""}`}
              aria-pressed={enabled}
              aria-label={enabled ? "Выключить зимние эффекты" : "Включить зимние эффекты"}
              title={enabled ? "Выключить снег" : "Включить снег"}
              onClick={toggle}
            >
              <SnowflakeIcon on={enabled} />
            </button>
          ) : null}
          <Link
            href="/feedback"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Контакты
          </Link>
        </nav>
      </div>
    </header>
  );
}
