import { AutumnHeroBanner } from "@/components/landing/AutumnDecor";
import { HashLink } from "@/components/ui/HashLink";

export function Hero({
  kicker = "Осень в КАРО",
  title = "Кино по твоему сценарию",
  text = "Приватный просмотр, групповой билет или мероприятие в кинозале КАРО — подберем формат для твоего повода",
  ctaHref = "#products",
  note = "подберём формат →",
}: {
  kicker?: string;
  title?: string;
  text?: string;
  ctaHref?: string;
  note?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="hero-glow pointer-events-none absolute inset-0 opacity-40" />
      <div className="hero-stage relative">
        <AutumnHeroBanner />
        <div className="hero-copy relative z-10 px-4 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <p className="mb-4 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
            {kicker}
          </p>
          <h1 className="max-w-xl font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-foreground/90 sm:text-2xl">
            {text}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <span className="autumn-only autumn-note hero-note" aria-hidden="true">
              {note}
            </span>
            <HashLink
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:brightness-110"
            >
              Оставить заявку
            </HashLink>
          </div>
        </div>
      </div>
    </section>
  );
}
