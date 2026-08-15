"use client";

import { useId, useMemo, useState } from "react";
import { Field, inputClassName } from "@/components/form/Field";
import { type CascadeValue } from "@/components/form/CascadeSelect";
import { ContentFields } from "@/components/form/ContentFields";
import { RentalHallFields } from "@/components/form/RentalHallFields";
import { ScheduleFields } from "@/components/form/ScheduleFields";
import { TicketCaptcha, type CaptchaSolution } from "@/components/form/TicketCaptcha";
import { digitsToPhone, formatPhoneDisplay } from "@/components/form/phone";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  applicationInputSchema,
  flattenErrors,
} from "@/lib/applications/schema";
import {
  PRODUCT_LIST,
  PRODUCTS,
  TICKET_TYPES,
  type ProductId,
} from "@/lib/products";

const emptyCascade: CascadeValue = { id: "", name: "", custom: "" };

function readUtm() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") ?? "",
    medium: params.get("utm_medium") ?? "",
    campaign: params.get("utm_campaign") ?? "",
    content: params.get("utm_content") ?? "",
    term: params.get("utm_term") ?? "",
  };
}

function getIdempotencyKey() {
  const key = "luxe-maxima-idempotency";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  sessionStorage.setItem(key, created);
  return created;
}

export function ApplicationForm({
  productId,
  onProductChange,
  lockProduct = false,
  source = "/",
}: {
  productId: ProductId;
  onProductChange?: (id: ProductId) => void;
  lockProduct?: boolean;
  source?: string;
}) {
  const formId = useId();
  const product = PRODUCTS[productId];
  const isRental = productId === "keys" || productId === "event";
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [comment, setComment] = useState("");
  const [watchCustom, setWatchCustom] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [schedule, setSchedule] = useState({
    city: emptyCascade,
    cinema: emptyCascade,
    hall: emptyCascade,
    hallFormat: emptyCascade,
    film: emptyCascade,
    session: emptyCascade,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [applicationId, setApplicationId] = useState("");
  const [formError, setFormError] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaSolution | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  function refreshCaptcha() {
    setCaptcha(null);
    setCaptchaKey((key) => key + 1);
  }

  const payload = useMemo(
    () => ({
      productId,
      source,
      contactName,
      phone: digitsToPhone(phone),
      email,
      guests,
      ticketType,
      rentalStart,
      rentalEnd,
      comment,
      watchCustom,
      city: schedule.city,
      cinema: schedule.cinema,
      hall: schedule.hall,
      hallFormat: schedule.hallFormat,
      film: schedule.film,
      session: schedule.session,
      consent: consent ? true : undefined,
      website,
    }),
    [
      productId,
      source,
      contactName,
      phone,
      email,
      guests,
      ticketType,
      rentalStart,
      rentalEnd,
      comment,
      watchCustom,
      schedule,
      consent,
      website,
    ],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    const parsed = applicationInputSchema.safeParse({
      ...payload,
      consent: consent || undefined,
      idempotencyKey: getIdempotencyKey(),
      utm: readUtm(),
    });
    if (!parsed.success) {
      setErrors(flattenErrors(parsed.error));
      setStatus("error");
      return;
    }
    if (!captcha) {
      setErrors({ captcha: "Оторвите корешок билета, чтобы отправить форму" });
      setStatus("error");
      return;
    }

    setErrors({});
    setStatus("loading");
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          captchaToken: captcha.token,
          captchaProof: captcha.proof,
        }),
      });
      const data = (await response.json()) as {
        id?: string;
        error?: string;
        fields?: Record<string, string>;
      };
      if (!response.ok) {
        refreshCaptcha();
        setErrors(data.fields ?? {});
        setFormError(data.error ?? "Не удалось отправить заявку");
        setStatus("error");
        return;
      }
      setApplicationId(data.id ?? "");
      sessionStorage.removeItem("luxe-maxima-idempotency");
      setStatus("success");
    } catch {
      setFormError("Нет соединения с сервером. Данные формы сохранены — попробуйте ещё раз.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-line bg-card p-8 text-center" role="status">
        <p className="font-[family-name:var(--font-display)] text-2xl">
          Заявка отправлена
        </p>
        <p className="mt-3 text-muted">
          Обращение по услуге «{product.title}» получено. Менеджер свяжется с вами.
        </p>
        {applicationId ? (
          <p className="mt-4 text-sm text-gold">Номер заявки: {applicationId}</p>
        ) : null}
        <button
          type="button"
          className="mt-8 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
          onClick={() => {
            setStatus("idle");
            setApplicationId("");
            refreshCaptcha();
          }}
        >
          Отправить ещё одну
        </button>
      </div>
    );
  }

  return (
    <form
      id="application-form"
      onSubmit={handleSubmit}
      noValidate
      className="space-y-8 rounded-3xl border border-line bg-card p-6 sm:p-8"
    >
      {lockProduct || !onProductChange ? null : (
        <fieldset>
          <legend className="mb-4 text-sm font-medium">Услуга</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {PRODUCT_LIST.map((item) => (
              <label
                key={item.id}
                className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm transition ${
                  item.id === productId
                    ? "border-primary bg-primary/10"
                    : "border-line hover:border-gold"
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name={`${formId}-product`}
                  value={item.id}
                  checked={item.id === productId}
                  onChange={() => {
                    setErrors({});
                    setStatus("idle");
                    setFormError("");
                    setWatchCustom("");
                    setSchedule({
                      city: emptyCascade,
                      cinema: emptyCascade,
                      hall: emptyCascade,
                      hallFormat: emptyCascade,
                      film: emptyCascade,
                      session: emptyCascade,
                    });
                    onProductChange(item.id);
                  }}
                />
                {item.title}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {isRental ? (
        <RentalHallFields
          key={productId}
          errors={errors}
          onChange={(value) =>
            setSchedule((current) => ({
              ...current,
              city: value.city,
              cinema: value.cinema,
              hallFormat: value.hallFormat,
              hall: value.hall,
            }))
          }
        />
      ) : (
        <ScheduleFields
          key={productId}
          productId={productId}
          errors={errors}
          onChange={(value) =>
            setSchedule((current) => ({
              ...current,
              ...value,
            }))
          }
        />
      )}

      {productId === "keys" ? (
        <ContentFields
          film={schedule.film}
          watchCustom={watchCustom}
          errors={errors}
          onFilmChange={(value) =>
            setSchedule((current) => ({ ...current, film: value }))
          }
          onWatchCustomChange={(value) => {
            setWatchCustom(value);
            if (value.trim()) {
              setSchedule((current) => ({ ...current, film: emptyCascade }));
            }
          }}
        />
      ) : null}

      {productId === "event" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="rentalStart"
            label="Дата и время начала"
            required
            error={errors.rentalStart}
          >
            <input
              id="rentalStart"
              className={inputClassName}
              type="datetime-local"
              value={rentalStart}
              onChange={(event) => setRentalStart(event.target.value)}
            />
          </Field>
          <Field
            id="rentalEnd"
            label="Дата и время окончания"
            required
            error={errors.rentalEnd}
          >
            <input
              id="rentalEnd"
              className={inputClassName}
              type="datetime-local"
              value={rentalEnd}
              onChange={(event) => setRentalEnd(event.target.value)}
            />
          </Field>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contactName" label="Контактное лицо" required error={errors.contactName}>
          <input
            id="contactName"
            className={inputClassName}
            autoComplete="name"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            aria-invalid={Boolean(errors.contactName)}
          />
        </Field>
        <Field id="phone" label="Телефон" required error={errors.phone}>
          <input
            id="phone"
            className={inputClassName}
            type="tel"
            autoComplete="tel"
            value={formatPhoneDisplay(phone)}
            onChange={(event) => setPhone(digitsToPhone(event.target.value))}
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>
        <Field id="email" label="Email" required error={errors.email}>
          <input
            id="email"
            className={inputClassName}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>
        <Field id="guests" label="Количество гостей" required error={errors.guests}>
          <input
            id="guests"
            className={inputClassName}
            inputMode="numeric"
            value={guests}
            onChange={(event) => setGuests(event.target.value.replace(/\D/g, ""))}
          />
        </Field>
        {product.fields.ticketType ? (
          <Field id="ticketType" label="Тип билета" required error={errors.ticketType}>
            <CustomSelect
              id="ticketType"
              value={ticketType}
              placeholder="Выберите"
              invalid={Boolean(errors.ticketType)}
              options={TICKET_TYPES.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              onChange={setTicketType}
            />
          </Field>
        ) : null}
      </div>

      <Field id="comment" label="Комментарий" error={errors.comment}>
        <textarea
          id="comment"
          className={`${inputClassName} min-h-28 resize-y`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </Field>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Сайт</label>
        <input
          id="website"
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
            <span className="mt-1 block text-primary">{errors.consent}</span>
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
        className="w-full rounded-full bg-primary px-6 py-4 font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Отправляем…" : "Отправить заявку"}
      </button>
    </form>
  );
}
