import { z } from "zod";
import { digitsToPhone } from "@/components/form/phone";

export const PHONE_PATTERN = /^\+7\d{10}$/;
export const PHONE_ERROR = "Укажите телефон в формате +7 XXX XXX-XX-XX";

export function toRuPhone(value: string) {
  return digitsToPhone(value);
}

export function isCompleteRuPhone(value: string) {
  return PHONE_PATTERN.test(toRuPhone(value));
}

export const ruPhoneSchema = z
  .string()
  .trim()
  .regex(PHONE_PATTERN, PHONE_ERROR);

export const ruPhoneInputSchema = z
  .string()
  .trim()
  .transform((value) => toRuPhone(value))
  .pipe(ruPhoneSchema);

export const optionalRuPhoneSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) return "";
    if (value.replace(/\D/g, "").length <= 1) return "";
    return toRuPhone(value);
  })
  .pipe(
    z
      .string()
      .refine((value) => !value || PHONE_PATTERN.test(value), PHONE_ERROR),
  );

export const emailFormatSchema = z
  .email("Укажите корректный email")
  .trim()
  .toLowerCase();

export function validateContactName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Укажите контактное лицо";
  if (trimmed.length > 200) return "Слишком длинное значение";
  return null;
}

export function validateEmailFormat(value: string) {
  const parsed = emailFormatSchema.safeParse(value);
  if (parsed.success) return null;
  return parsed.error.issues[0]?.message ?? "Укажите корректный email";
}

export function validateRuPhone(value: string) {
  return isCompleteRuPhone(value) ? null : PHONE_ERROR;
}

export function validateGuests(value: string) {
  const guests = Number(value);
  if (!value.trim() || !Number.isInteger(guests) || guests < 1) {
    return "Укажите количество гостей — целое число больше 0";
  }
  if (guests > 10000) return "Слишком большое количество гостей";
  return null;
}
