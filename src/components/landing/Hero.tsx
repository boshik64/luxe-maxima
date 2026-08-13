export function Hero({
  kicker = "Роскошный максимум",
  title = "Три услуги КАРО — одна заявка менеджеру",
  text = "Ключи от зала, групповой поход и мероприятие. Заявка сразу попадает в административную панель.",
}: {
  kicker?: string;
  title?: string;
  text?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(1200px 500px at 80% -10%, rgba(233,26,59,0.35), transparent), radial-gradient(800px 400px at 10% 110%, rgba(212,179,122,0.18), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-32">
        <p className="mb-4 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
          {kicker}
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{text}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="#form"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Оставить заявку
          </a>
        </div>
      </div>
    </section>
  );
}
