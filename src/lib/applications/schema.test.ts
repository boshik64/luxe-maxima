import assert from "node:assert/strict";
import test from "node:test";
import { applicationInputSchema } from "./schema";

const base = {
  contactName: "Иван",
  phone: "+79001234567",
  email: "ivan@example.com",
  consent: true as const,
  website: "",
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  guests: "20",
  city: { id: "1", name: "Москва", custom: "" },
  cinema: { id: "3", name: "7 Атриум", custom: "" },
};

test("accepts keys application with session", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "keys",
    hall: { id: "29", name: "Стандарт", custom: "" },
    session: { id: "123", name: "12.08 22:35", custom: "" },
  });
  assert.equal(parsed.success, true);
});

test("accepts group application with ticket type", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "group",
    ticketType: "student",
    session: { id: "__custom__", name: "", custom: "Суббота вечером" },
  });
  assert.equal(parsed.success, true);
});

test("event does not require session but requires rental time", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "event",
    hall: { id: "28", name: "Премиум", custom: "" },
    rentalDate: "2026-09-01",
    rentalTime: "18:00",
  });
  assert.equal(parsed.success, true);
});

test("rejects invalid phone", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "group",
    phone: "89001234567",
    ticketType: "standard",
    session: { id: "1", name: "сеанс", custom: "" },
  });
  assert.equal(parsed.success, false);
});

test("honeypot website must be empty", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "group",
    ticketType: "standard",
    session: { id: "1", name: "сеанс", custom: "" },
    website: "https://spam.test",
  });
  assert.equal(parsed.success, false);
});
