import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { CONTACTS, KARO_SITE_URL } from "@/lib/contacts";

export function FeedbackPage() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="mb-3 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
            Контакты
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold sm:text-5xl">
            Обратная связь
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Свяжитесь с нами по телефону или электронной почте — форма на сайте
            скрыта.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href={CONTACTS.phoneHref}
              className="rounded-3xl border border-line bg-card p-5 transition hover:border-gold"
            >
              <p className="text-xs tracking-[0.2em] text-gold uppercase">Телефон</p>
              <p className="mt-3 font-semibold">{CONTACTS.phoneDisplay}</p>
            </a>
            <a
              href={`mailto:${CONTACTS.email}`}
              className="rounded-3xl border border-line bg-card p-5 transition hover:border-gold"
            >
              <p className="text-xs tracking-[0.2em] text-gold uppercase">
                Заявки на услуги
              </p>
              <p className="mt-3 font-semibold">{CONTACTS.email}</p>
            </a>
            <a
              href={`mailto:${CONTACTS.feedbackEmail}`}
              className="rounded-3xl border border-line bg-card p-5 transition hover:border-gold"
            >
              <p className="text-xs tracking-[0.2em] text-gold uppercase">Почта</p>
              <p className="mt-3 font-semibold">{CONTACTS.feedbackEmail}</p>
            </a>
            <div className="rounded-3xl border border-line bg-card p-5">
              <p className="text-xs tracking-[0.2em] text-gold uppercase">Офис</p>
              <p className="mt-3 font-semibold">{CONTACTS.address}</p>
            </div>
          </div>

          <div className="mt-6">
            <a
              href={KARO_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gold underline underline-offset-4"
            >
              Вернуться на сайт КАРО
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
