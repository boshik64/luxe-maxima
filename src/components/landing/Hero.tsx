import { AutumnHeroCollage } from "@/components/landing/AutumnDecor";
import { HashLink } from "@/components/ui/HashLink";

export function Hero({
  kicker = "Осень в КАРО",
  title = "Тёплый сезон — в тёмном зале",
  text = "Заберите себе целый зал: свой фильм, своя компания, свой сеанс.",
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
      <div className="hero-grid relative mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
        <div>
          <p className="mb-4 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
            {kicker}
          </p>
          <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">{text}</p>
          <div className="mt-10">
            <HashLink
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:brightness-110"
            >
              Оставить заявку
            </HashLink>
          </div>
        </div>
        <AutumnHeroCollage note={note} />
      </div>
    </section>
  );
}
