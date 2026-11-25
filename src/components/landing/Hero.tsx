import { AutumnHeroBanner } from "@/components/landing/AutumnDecor";
import { WinterGarland } from "@/components/landing/WinterGarland";
import { HashLink } from "@/components/ui/HashLink";
import { getSeasonCampaignLabel } from "@/lib/site-theme";

export function Hero({
  kicker = getSeasonCampaignLabel(),
  title = "Кино по твоему сценарию",
  text = "Приватный зал, билеты для большой компании или мероприятие в КАРО — выбирай свой формат.",
  ctaHref = "#products",
  ctaLabel = "Оставить заявку",
  note = "подберём формат →",
}: {
  kicker?: string;
  title?: string;
  text?: string;
  ctaHref?: string;
  ctaLabel?: string;
  note?: string;
}) {
  return (
    <section className="relative border-b border-line">
      <div className="hero-glow pointer-events-none absolute inset-0 opacity-40" />
      <div className="hero-stage relative overflow-hidden">
        <AutumnHeroBanner />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
          <div className="hero-copy">
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
                {ctaLabel}
              </HashLink>
            </div>
          </div>
        </div>
      </div>
      <WinterGarland />
    </section>
  );
}
