import assert from "node:assert/strict";
import test from "node:test";
import { applicationInputSchema } from "./schema";

const base = {
  contactName: "Иван",
  contactLastName: "Иванов",
  phone: "+79001234567",
  email: "ivan@example.com",
  consent: true as const,
  website: "",
  idempotencyKey: "11111111-1111-4111-8111-111111111111",
  guests: "20",
  city: { id: "1", name: "Москва", custom: "" },
  cinema: { id: "cinema-1", name: "7 Атриум", custom: "" },
};

test("accepts keys application with repertoire checkbox", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "keys",
    hall: { id: "hall-1", name: "IMAX", custom: "" },
    wantRepertoireFilm: true,
    rentalStart: "2026-09-01T18:00",
  });
  assert.equal(parsed.success, true);
});

test("accepts keys application with custom content checkbox", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "keys",
    hall: { id: "hall-1", name: "Зал 1", custom: "" },
    wantCustomContent: true,
    rentalStart: "2026-09-01T18:00",
  });
  assert.equal(parsed.success, true);
});

test("accepts keys application with both content checkboxes", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "keys",
    hall: { id: "hall-1", name: "Зал 1", custom: "" },
    wantRepertoireFilm: true,
    wantCustomContent: true,
    rentalStart: "2026-09-01T18:00",
  });
  assert.equal(parsed.success, true);
});

test("rejects keys application without content choice", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "keys",
    hall: { id: "hall-1", name: "Зал 1", custom: "" },
    rentalStart: "2026-09-01T18:00",
  });
  assert.equal(parsed.success, false);
});

test("rejects keys application without session date and time", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "keys",
    hall: { id: "hall-1", name: "Зал 1", custom: "" },
    wantCustomContent: true,
  });
  assert.equal(parsed.success, false);
});

test("rejects keys application with custom cinema", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "keys",
    cinema: { id: "__custom__", name: "", custom: "Мой кинотеатр" },
    hall: { id: "hall-1", name: "Зал 1", custom: "" },
    wantCustomContent: true,
    rentalStart: "2026-09-01T18:00",
  });
  assert.equal(parsed.success, false);
});

test("accepts group application with film, date, session and ticket type", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "group",
    ticketType: "student",
    film: { id: "1", name: "Фильм", custom: "" },
    rentalDate: "2026-09-01",
    session: { id: "__custom__", name: "", custom: "Суббота вечером" },
  });
  assert.equal(parsed.success, true);
});

test("rejects group application without ticket type", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "group",
    film: { id: "1", name: "Фильм", custom: "" },
    rentalDate: "2026-09-01",
    session: { id: "s1", name: "18:00", custom: "" },
  });
  assert.equal(parsed.success, false);
});

test("event requires hall and rental datetime without format", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "event",
    hall: { id: "hall-1", name: "Зал Премиум", custom: "" },
    rentalStart: "2026-09-01T18:00",
  });
  assert.equal(parsed.success, true);
});

test("event rejects missing rental datetime", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "event",
    hall: { id: "hall-1", name: "Зал Премиум", custom: "" },
  });
  assert.equal(parsed.success, false);
});

test("rejects invalid phone", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "keys",
    hall: { id: "hall-1", name: "Зал 1", custom: "" },
    wantCustomContent: true,
    rentalStart: "2026-09-01T18:00",
    phone: "89001234567",
  });
  assert.equal(parsed.success, false);
});

test("honeypot website must be empty", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    productId: "keys",
    hall: { id: "hall-1", name: "Зал 1", custom: "" },
    wantCustomContent: true,
    rentalStart: "2026-09-01T18:00",
    website: "https://spam.test",
  });
  assert.equal(parsed.success, false);
});

test("rejects missing last name", () => {
  const parsed = applicationInputSchema.safeParse({
    ...base,
    contactLastName: "",
    productId: "event",
    hall: { id: "hall-1", name: "Зал 1", custom: "" },
    rentalStart: "2026-09-01T18:00",
  });
  assert.equal(parsed.success, false);
});
