import { z } from "zod";
import {
  emailFormatSchema,
  ruPhoneInputSchema,
} from "@/lib/validation/contact";

const STATUSES = [
  "NEW",
  "WAITING_REPLY",
  "ANSWERED",
  "IN_PROGRESS",
  "CLOSED",
  "REJECTED",
] as const;

const optionalText = (max: number, message = "Слишком длинное значение") =>
  z.string().trim().max(max, message);

export const applicationAdminPatchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  contactName: z
    .string()
    .trim()
    .min(1, "Укажите контактное лицо")
    .max(200, "Слишком длинное значение")
    .optional(),
  phone: ruPhoneInputSchema.optional(),
  email: emailFormatSchema.optional(),
  comment: optionalText(2000).optional(),
  guests: z
    .number()
    .int("Укажите целое число гостей")
    .min(1, "Укажите количество гостей — целое число больше 0")
    .max(10000, "Слишком большое количество гостей")
    .optional(),
  cityId: optionalText(80).optional().nullable(),
  cityName: optionalText(200).optional(),
  cinemaId: optionalText(80).optional().nullable(),
  cinemaName: optionalText(200).optional(),
  hallId: optionalText(80).optional().nullable(),
  hallName: optionalText(200).optional(),
  hallFormatName: optionalText(200).optional(),
  hallCapacity: z.number().int().min(0).max(10000).optional().nullable(),
  hallRentalPrice: z.number().int().min(0).optional().nullable(),
  hallRentalPriceWeekday: z.number().int().min(0).optional().nullable(),
  hallRentalPriceWeekend: z.number().int().min(0).optional().nullable(),
  filmId: optionalText(80).optional().nullable(),
  filmName: optionalText(200).optional(),
  sessionId: optionalText(80).optional().nullable(),
  sessionLabel: optionalText(200).optional(),
  sessionCustom: optionalText(200).optional(),
  rentalDate: optionalText(40).optional(),
  rentalTime: optionalText(40).optional(),
  rentalStart: optionalText(40).optional(),
  rentalEnd: optionalText(40).optional(),
  rentalDuration: optionalText(80).optional(),
  ticketType: optionalText(80).optional(),
  adminComment: optionalText(4000).optional(),
  watchCustom: optionalText(200).optional().nullable(),
});

export type ApplicationAdminPatch = z.infer<typeof applicationAdminPatchSchema>;

export function flattenPatchErrors(
  error: z.ZodError<ApplicationAdminPatch>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "form";
    if (!result[path]) result[path] = issue.message;
  }
  return result;
}
