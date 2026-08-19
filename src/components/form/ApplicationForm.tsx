"use client";

import { useMemo, useState } from "react";
import { DateTimePicker } from "@/components/form/DatePicker";
import { Field, FormStep, inputClassName } from "@/components/form/Field";
import { type CascadeValue } from "@/components/form/CascadeSelect";
import { ContentFields } from "@/components/form/ContentFields";
import { RentalHallFields } from "@/components/form/RentalHallFields";
import { ScheduleFields } from "@/components/form/ScheduleFields";
import { TicketCaptcha, type CaptchaSolution } from "@/components/form/TicketCaptcha";
import { digitsToPhone, formatPhoneDisplay } from "@/components/form/phone";
import { ProductGlyph } from "@/components/landing/AutumnDecor";
import { parseResponseJson } from "@/lib/api-json";
import { createClientId } from "@/lib/id";
import {
  applicationInputSchema,
  flattenErrors,
} from "@/lib/applications/schema";
import { CUSTOM_OPTION_ID } from "@/lib/karo/types";
import {
  PRODUCT_LIST,
  PRODUCTS,
  TICKET_TYPES,
  type ProductId,
} from "@/lib/products";

const emptyCascade: CascadeValue = { id: "", name: "", custom: "" };
const PRODUCT_GLYPH: Record<ProductId, "key" | "flute" | "people"> = {
  keys: "key",
  group: "people",
  event: "flute",
};

function cascadeReady(value: CascadeValue) {
  if (value.id === CUSTOM_OPTION_ID) return Boolean(value.custom.trim());
  return Boolean(value.id);
}

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
  const created = createClientId();
  sessionStorage.setItem(key, created);
  return created;
}

export function ApplicationForm({
  productId,
  onProductChange,
  lockProduct = false,
  source = "/",
}: {
  productId?: ProductId;
  onProductChange?: (id: ProductId) => void;
  lockProduct?: boolean;
  source?: string;
}) {
  const product = productId ? PRODUCTS[productId] : null;
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState("");
  const [rentalStart, setRentalStart] = useState("");
  const [comment, setComment] = useState("");
  const [watchCustom, setWatchCustom] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [schedule, setSchedule] = useState({
    city: emptyCascade,
    cinema: emptyCascade,
    hall: emptyCascade,
    hallFormat: emptyCascade,
    film: emptyCascade,
    session: emptyCascade,
    sessionDate: "",
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

  function resetDetails() {
    setErrors({});
    setStatus("idle");
    setFormError("");
    setWatchCustom("");
    setTicketType("");
    setRentalStart("");
    setGuests("");
    setSchedule({
      city: emptyCascade,
      cinema: emptyCascade,
      hall: emptyCascade,
      hallFormat: emptyCascade,
      film: emptyCascade,
      session: emptyCascade,
      sessionDate: "",
    });
  }

  const payload = useMemo(
    () => ({
      productId: productId ?? "keys",
      source,
      contactName,
      phone: digitsToPhone(phone),
      email,
      guests,
      rentalStart,
      rentalDate:
        productId === "keys" || productId === "event"
          ? rentalStart.slice(0, 10)
          : productId === "group"
            ? schedule.sessionDate
            : "",
      rentalTime: productId === "keys" || productId === "event" ? rentalStart.slice(11, 16) : "",
      comment,
      watchCustom,
      ticketType,
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
      rentalStart,
      comment,
      watchCustom,
      ticketType,
      schedule,
      consent,
      website,
    ],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!productId) return;
    setFormError("");
    const parsed = applicationInputSchema.safeParse({
      ...payload,
      productId,
      consent: consent || undefined,
      idempotencyKey: getIdempotencyKey(),
      utm: readUtm(),
    });
    if (!parsed.success) {
      const nextErrors = flattenErrors(parsed.error);
      if (!captcha) {
        nextErrors.captcha = "Оторвите корешок билета, чтобы отправить форму";
      }
      setErrors(nextErrors);
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
      const data = await parseResponseJson<{
        id?: string;
        error?: string;
        fields?: Record<string, string>;
      }>(response);
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

  const guestsFilled = Number(guests) >= 1;
  const hallFilled = cascadeReady(schedule.hall);
  const contentFilled =
    cascadeReady(schedule.film) || Boolean(watchCustom.trim());
  const dateFilled = Boolean(rentalStart);
  const groupFilmFilled = cascadeReady(schedule.film);
  const groupSessionFilled = cascadeReady(schedule.session);
  const ticketTypeFilled = TICKET_TYPES.some((item) => item.value === ticketType);
  const rentalReady = Boolean(productId === "keys" || productId === "event");
  const detailsReady =
    productId === "group"
      ? groupFilmFilled && groupSessionFilled && guestsFilled && ticketTypeFilled
      : Boolean(productId) &&
        hallFilled &&
        (productId === "event" || contentFilled) &&
        dateFilled;

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-line bg-card p-8 text-center" role="status">
        <p className="font-[family-name:var(--font-display)] text-2xl">
          Заявка отправлена
        </p>
        <p className="mt-3 text-muted">
          Обращение по услуге «{product?.title}» получено. Менеджер свяжется с вами.
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
      {lockProduct ? null : (
        <fieldset>
          <legend className="mb-4 text-sm font-medium">Формат</legend>
          <div className="form-product-grid">
            {PRODUCT_LIST.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`form-product-btn ${item.id === productId ? "is-active" : ""}`}
                aria-pressed={item.id === productId}
                onClick={() => {
                  if (item.id !== productId) resetDetails();
                  onProductChange?.(item.id);
                }}
              >
                <ProductGlyph kind={PRODUCT_GLYPH[item.id]} />
                <span className="form-product-kicker">{item.kicker}</span>
                <span className="form-product-title">{item.title}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <FormStep show={rentalReady}>
        <RentalHallFields
          key={productId}
          errors={errors}
          guestsFilled={guestsFilled}
          guests={
            <Field id="guests" label="Количество гостей" required error={errors.guests}>
              <input
                id="guests"
                className={inputClassName}
                inputMode="numeric"
                value={guests}
                onChange={(event) => setGuests(event.target.value.replace(/\D/g, ""))}
              />
            </Field>
          }
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
      </FormStep>

      <FormStep show={productId === "group"}>
        <ScheduleFields
          key={productId}
          productId="group"
          errors={errors}
          onChange={(value) =>
            setSchedule((current) => ({
              ...current,
              city: value.city,
              cinema: value.cinema,
              hall: value.hall,
              film: value.film,
              session: value.session,
              sessionDate: value.sessionDate,
            }))
          }
        />
      </FormStep>

      <FormStep show={Boolean(productId === "keys" && hallFilled)}>
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
      </FormStep>

      <FormStep
        show={
          Boolean(productId === "keys" || productId === "event") &&
          hallFilled &&
          (productId === "event" || contentFilled)
        }
      >
        <Field
          id={productId === "keys" ? "keysRentalStart" : "rentalStart"}
          label={productId === "keys" ? "Дата и время сеанса" : "Дата и время"}
          required
          error={errors.rentalStart}
        >
          <DateTimePicker
            id={productId === "keys" ? "keysRentalStart" : "rentalStart"}
            value={rentalStart}
            invalid={Boolean(errors.rentalStart)}
            onChange={setRentalStart}
          />
        </Field>
      </FormStep>

      <FormStep show={productId === "group" && groupSessionFilled}>
        <Field id="guests" label="Количество гостей" required error={errors.guests}>
          <input
            id="guests"
            className={inputClassName}
            inputMode="numeric"
            value={guests}
            onChange={(event) => setGuests(event.target.value.replace(/\D/g, ""))}
          />
        </Field>
      </FormStep>

      <FormStep show={productId === "group" && groupSessionFilled && guestsFilled}>
        <fieldset>
          <legend className="mb-4 text-sm font-medium">
            Тип билета
            <span className="text-primary" aria-hidden="true">
              {" "}
              *
            </span>
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {TICKET_TYPES.map((item) => (
              <label
                key={item.value}
                className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm transition ${
                  ticketType === item.value
                    ? "border-primary bg-primary/10"
                    : "border-line hover:border-gold"
                }`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="ticketType"
                  value={item.value}
                  checked={ticketType === item.value}
                  onChange={() => setTicketType(item.value)}
                />
                {item.label}
              </label>
            ))}
          </div>
          {errors.ticketType ? (
            <p role="alert" className="mt-2 text-sm text-primary">
              {errors.ticketType}
            </p>
          ) : null}
        </fieldset>
      </FormStep>

      <FormStep show={detailsReady} variant="contacts">
        <p className="text-sm text-muted">
          Остались только контактные данные — менеджер свяжется с вами по ним.
        </p>
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
        <TicketCaptcha key={captchaKey} error={errors.captcha} onSolved={setCaptcha} />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full bg-primary px-6 py-4 font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
        >
          {status === "loading" ? "Отправляем…" : "Отправить заявку"}
        </button>
      </FormStep>
    </form>
  );
}
