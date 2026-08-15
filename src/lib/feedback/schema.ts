import { z } from "zod";
import { emailFormatSchema, optionalRuPhoneSchema } from "@/lib/validation/contact";

export const feedbackInputSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(200),
  email: emailFormatSchema,
  phone: optionalRuPhoneSchema,
  message: z
    .string()
    .trim()
    .min(10, "Напишите сообщение — не меньше 10 символов")
    .max(4000, "Слишком длинное сообщение"),
  consent: z.literal(true, "Нужно согласие на обработку персональных данных"),
  website: z.string().max(0, "Спам").optional().or(z.literal("")),
  source: z.string().trim().max(120).optional().or(z.literal("")),
  idempotencyKey: z.uuid("Некорректный ключ запроса"),
});

export function flattenFeedbackErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "form";
    if (!result[path]) result[path] = issue.message;
  }
  return result;
}

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
