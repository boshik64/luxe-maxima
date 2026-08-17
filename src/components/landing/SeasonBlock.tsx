import { AutumnTicketCollage } from "@/components/landing/AutumnDecor";
import { HashLink } from "@/components/ui/HashLink";

const SEASON_POINTS = [
  {
    title: "Свой сеанс",
    text: "Фильм из репертуара или ваш ролик на большом экране — вечер идёт по вашему сценарию.",
  },
  {
    title: "Своя компания",
    text: "От школьного похода на пару рядов до полного зала на корпоратив.",
  },
  {
    title: "Своя атмосфера",
    text: "Попкорн, напитки и поздравление на экране — детали обсудим с менеджером.",
  },
];

export function SeasonBlock() {
  return (
    <section className="autumn-only autumn-season">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="autumn-season-grid">
          <div className="autumn-season-art">
            <AutumnTicketCollage />
          </div>
          <div className="autumn-season-copy">
            <p className="mb-3 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
              Сезон уютных впечатлений
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Осень — лучший повод занять целый зал
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-muted">
              Когда за окном темнеет в пять, самый тёплый план на вечер — мягкое
              кресло, ведёрко попкорна и большой экран. Соберите своих: класс,
              команду, семью или гостей корпоратива — и заберите сеанс себе.
            </p>
            <dl className="mt-8 grid gap-5 sm:grid-cols-3">
              {SEASON_POINTS.map((point) => (
                <div key={point.title}>
                  <dt className="font-[family-name:var(--font-display)] text-lg">
                    {point.title}
                  </dt>
                  <dd className="mt-2 text-sm text-muted">{point.text}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <HashLink
                href="#form"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:brightness-110"
              >
                Забрать сеанс
              </HashLink>
              <span className="autumn-note" aria-hidden="true">
                начнём с даты →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
