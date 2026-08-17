import { z } from "zod";
import { PRODUCT_IDS, type ProductId } from "@/lib/products";
import { CUSTOM_OPTION_ID } from "@/lib/karo/types";
import { emailFormatSchema, ruPhoneSchema } from "@/lib/validation/contact";

const requiredText = (message: string, max = 200) =>
  z.string().trim().min(1, message).max(max, "Слишком длинное значение");

const optionalText = (max = 2000) =>
  z.string().trim().max(max, "Слишком длинное значение").optional().or(z.literal(""));

function catalogOrCustom(label: string) {
  return z
    .object({
      id: z.string().optional().or(z.literal("")),
      name: z.string().optional().or(z.literal("")),
      custom: z.string().trim().max(200).optional().or(z.literal("")),
    })
    .superRefine((value, ctx) => {
      if (value.id === CUSTOM_OPTION_ID) {
        if (!value.custom?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: `Укажите ${label} вручную`,
            path: ["custom"],
          });
        }
        return;
      }
      if (!value.id) {
        ctx.addIssue({
          code: "custom",
          message: `Выберите ${label}`,
          path: ["id"],
        });
      }
    });
}

const optionalCatalog = z
  .object({
    id: z.string().optional().or(z.literal("")),
    name: z.string().optional().or(z.literal("")),
    custom: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .optional();

export const applicationInputSchema = z
  .object({
    productId: z.enum(PRODUCT_IDS),
    source: z.string().trim().max(120).optional().or(z.literal("")),
    contactName: requiredText("Укажите контактное лицо"),
    phone: ruPhoneSchema,
    email: emailFormatSchema,
    guests: z.string().trim().optional().or(z.literal("")),
    ticketType: z.string().trim().optional().or(z.literal("")),
    comment: optionalText(),
    watchCustom: optionalText(200),
    rentalDate: z.string().trim().optional().or(z.literal("")),
    rentalTime: z.string().trim().optional().or(z.literal("")),
    rentalDuration: z.string().trim().optional().or(z.literal("")),
    rentalStart: z.string().trim().optional().or(z.literal("")),
    rentalEnd: z.string().trim().optional().or(z.literal("")),
    city: catalogOrCustom("город"),
    cinema: optionalCatalog,
    hall: optionalCatalog,
    hallFormat: optionalCatalog,
    film: optionalCatalog,
    session: optionalCatalog,
    consent: z.literal(true, "Нужно согласие на обработку персональных данных"),
    website: z.string().max(0, "Спам").optional().or(z.literal("")),
    idempotencyKey: z.uuid("Некорректный ключ запроса"),
    utm: z
      .object({
        source: optionalText(120),
        medium: optionalText(120),
        campaign: optionalText(120),
        content: optionalText(120),
        term: optionalText(120),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    const guests = Number(value.guests);
    if (!value.guests || !Number.isInteger(guests) || guests < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Укажите количество гостей — целое число больше 0",
        path: ["guests"],
      });
    }

    if (value.productId === "keys" || value.productId === "event") {
      if (!value.cinema?.id || value.cinema.id === CUSTOM_OPTION_ID) {
        ctx.addIssue({
          code: "custom",
          message: "Выберите кинотеатр из списка",
          path: ["cinema", "id"],
        });
      }
      if (!value.hallFormat?.id || value.hallFormat.id === CUSTOM_OPTION_ID) {
        ctx.addIssue({
          code: "custom",
          message: "Выберите формат зала",
          path: ["hallFormat", "id"],
        });
      }
      if (!value.hall?.id || value.hall.id === CUSTOM_OPTION_ID) {
        ctx.addIssue({
          code: "custom",
          message: "Выберите зал",
          path: ["hall", "id"],
        });
      }
    }

    if (value.productId === "keys") {
      const hasFilm = Boolean(value.film?.id && value.film.id !== CUSTOM_OPTION_ID);
      const hasWatchCustom = Boolean(value.watchCustom?.trim());
      if (hasFilm === hasWatchCustom) {
        ctx.addIssue({
          code: "custom",
          message: hasFilm
            ? "Заполните только одно поле: фильм из репертуара или свой контент"
            : "Выберите фильм из репертуара или укажите, что будете смотреть",
          path: hasFilm ? ["watchCustom"] : ["film", "id"],
        });
      }
      if (!value.rentalStart) {
        ctx.addIssue({
          code: "custom",
          message: "Укажите дату и время сеанса",
          path: ["rentalStart"],
        });
      } else if (!Number.isFinite(Date.parse(value.rentalStart))) {
        ctx.addIssue({
          code: "custom",
          message: "Некорректная дата и время сеанса",
          path: ["rentalStart"],
        });
      }
    }

    if (value.productId === "event") {
      if (!value.rentalStart) {
        ctx.addIssue({
          code: "custom",
          message: "Укажите дату и время",
          path: ["rentalStart"],
        });
      } else if (!Number.isFinite(Date.parse(value.rentalStart))) {
        ctx.addIssue({
          code: "custom",
          message: "Некорректная дата и время",
          path: ["rentalStart"],
        });
      }
    }
  });

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type FieldErrors = Record<string, string>;

export function flattenErrors(error: z.ZodError<ApplicationInput>): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "form";
    if (!result[path]) result[path] = issue.message;
  }
  return result;
}

export function isProductIdValue(value: string): value is ProductId {
  return PRODUCT_IDS.includes(value as ProductId);
}
