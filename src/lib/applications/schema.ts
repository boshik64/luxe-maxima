import { z } from "zod";
import { PRODUCT_IDS, type ProductId } from "@/lib/products";
import { CUSTOM_OPTION_ID } from "@/lib/karo/types";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+7\d{10}$/, "Укажите телефон в формате +7 XXX XXX-XX-XX");

const emailSchema = z.email("Укажите корректный email").trim().toLowerCase();

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
    phone: phoneSchema,
    email: emailSchema,
    guests: z.string().trim().optional().or(z.literal("")),
    ticketType: z.string().trim().optional().or(z.literal("")),
    comment: optionalText(),
    rentalDate: z.string().trim().optional().or(z.literal("")),
    rentalTime: z.string().trim().optional().or(z.literal("")),
    rentalDuration: z.string().trim().optional().or(z.literal("")),
    city: catalogOrCustom("город"),
    cinema: catalogOrCustom("кинотеатр"),
    hall: optionalCatalog,
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

    if (value.productId === "group" && !value.ticketType) {
      ctx.addIssue({
        code: "custom",
        message: "Выберите тип билета",
        path: ["ticketType"],
      });
    }

    if (value.productId === "keys" || value.productId === "event") {
      if (!value.hall?.id && !value.hall?.custom) {
        ctx.addIssue({
          code: "custom",
          message: "Выберите зал",
          path: ["hall", "id"],
        });
      }
    }

    if (value.productId === "keys" || value.productId === "group") {
      const sessionOk =
        value.session?.id === CUSTOM_OPTION_ID
          ? Boolean(value.session.custom?.trim())
          : Boolean(value.session?.id);
      if (!sessionOk) {
        ctx.addIssue({
          code: "custom",
          message: "Выберите сеанс или укажите своё время",
          path: ["session", "id"],
        });
      }
    }

    if (value.productId === "event") {
      if (!value.rentalDate) {
        ctx.addIssue({
          code: "custom",
          message: "Укажите дату аренды",
          path: ["rentalDate"],
        });
      }
      if (!value.rentalTime) {
        ctx.addIssue({
          code: "custom",
          message: "Укажите время начала",
          path: ["rentalTime"],
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
