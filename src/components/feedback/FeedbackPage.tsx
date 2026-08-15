"use client";

import { useId, useState } from "react";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Field, inputClassName } from "@/components/form/Field";
import { TicketCaptcha, type CaptchaSolution } from "@/components/form/TicketCaptcha";
import { digitsToPhone, formatPhoneDisplay } from "@/components/form/phone";
import { CONTACTS, KARO_SITE_URL } from "@/lib/contacts";

function getIdempotencyKey() {
  const key = "luxe-feedback-idempotency";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  sessionStorage.setItem(key, created);
  return created;
}

export function FeedbackPage() {
  const formId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+7");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [formError, setFormError] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaSolution | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  function refreshCaptcha() {
    setCaptcha(null);
    setCaptchaKey((key) => key + 1);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    if (!captcha) {
      setErrors({ captcha: "Оторвите корешок билета, чтобы отправить форму" });
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone.replace(/\D/g, "").length > 1 ? digitsToPhone(phone) : "",
          message,
          consent: consent || undefined,
          website,
          source: "/feedback",
          idempotencyKey: getIdempotencyKey(),
          captchaToken: captcha.token,
          captchaProof: captcha.proof,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        fields?: Record<string, string>;
      };
      if (!response.ok) {
        refreshCaptcha();
        setErrors(data.fields ?? {});
        setFormError(data.error ?? "Не удалось отправить сообщение");
        setStatus("error");
        return;
      }
      sessionStorage.removeItem("luxe-feedback-idempotency");
      setStatus("success");
    } catch {
      setFormError("Нет соединения с сервером. Попробуйте ещё раз.");
      setStatus("error");
    }
  }

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
            Напишите нам по аренде зала, групповым походам и мероприятиям. Сообщение
            попадёт в отдельную очередь в админке, не смешиваясь с заявками на
            услуги.
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

          <div className="mt-14 max-w-3xl">
            {status === "success" ? (
              <div
                className="rounded-3xl border border-line bg-card p-8 text-center"
                role="status"
              >
                <p className="font-[family-name:var(--font-display)] text-2xl">
                  Сообщение отправлено
                </p>
                <p className="mt-3 text-muted">
                  Мы получили обращение и ответим на указанный email.
                </p>
                <button
                  type="button"
                  className="mt-8 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
                  onClick={() => {
                    setStatus("idle");
                    setName("");
                    setEmail("");
                    setPhone("+7");
                    setMessage("");
                    setConsent(false);
                    setErrors({});
                    refreshCaptcha();
                  }}
                >
                  Написать ещё
                </button>
              </div>
            ) : (
              <form
                id={formId}
                onSubmit={(event) => void onSubmit(event)}
                noValidate
                className="space-y-6 rounded-3xl border border-line bg-card p-6 sm:p-8"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="fb-name" label="Имя" required error={errors.name}>
                    <input
                      id="fb-name"
                      className={inputClassName}
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </Field>
                  <Field id="fb-email" label="Email" required error={errors.email}>
                    <input
                      id="fb-email"
                      type="email"
                      className={inputClassName}
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Field>
                  <Field id="fb-phone" label="Телефон" error={errors.phone}>
                    <input
                      id="fb-phone"
                      type="tel"
                      className={inputClassName}
                      autoComplete="tel"
                      value={formatPhoneDisplay(phone)}
                      onChange={(event) =>
                        setPhone(digitsToPhone(event.target.value))
                      }
                    />
                  </Field>
                </div>
                <Field id="fb-message" label="Сообщение" required error={errors.message}>
                  <textarea
                    id="fb-message"
                    className={`${inputClassName} min-h-36 resize-y`}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </Field>
                <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                  <label htmlFor="fb-website">Сайт</label>
                  <input
                    id="fb-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </div>
                <label className="flex items-start gap-3 text-sm text-muted">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  <span>
                    Согласен на обработку персональных данных согласно{" "}
                    <a
                      className="text-gold underline underline-offset-4"
                      href="https://static.karofilm.ru/uploads/filemanager/offer/politika_pers_dannih.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      политике КАРО
                    </a>
                    .
                    {errors.consent ? (
                      <span className="mt-1 block text-primary">
                        {errors.consent}
                      </span>
                    ) : null}
                  </span>
                </label>
                {formError ? (
                  <p role="alert" className="text-sm text-primary">
                    {formError}
                  </p>
                ) : null}
                <TicketCaptcha
                  key={captchaKey}
                  error={errors.captcha}
                  onSolved={setCaptcha}
                />
                <button
                  type="submit"
                  disabled={status === "loading" || !captcha}
                  className="rounded-full bg-primary px-6 py-4 font-semibold text-white disabled:opacity-60"
                >
                  {status === "loading" ? "Отправляем…" : "Отправить сообщение"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
