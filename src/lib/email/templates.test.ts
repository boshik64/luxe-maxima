import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applicationGuestEmail,
  applicationStaffEmail,
  feedbackGuestEmail,
  feedbackStaffEmail,
} from "./templates";
import type { Application, Feedback } from "@prisma/client";

const application = {
  id: "app-demo-id",
  productId: "keys",
  source: "/",
  cityName: "Москва",
  cinemaName: "11 Октябрь",
  hallName: "Зал 1",
  hallFormatName: "Комфорт+",
  hallCapacity: 120,
  hallRentalPriceWeekday: 80000,
  hallRentalPriceWeekend: 95000,
  hallRentalPrice: null,
  filmName: "Свой контент",
  sessionLabel: null,
  sessionCustom: null,
  rentalStart: "2026-09-15 19:00",
  rentalDate: "2026-09-15",
  rentalTime: "19:00",
  rentalDuration: null,
  rentalEnd: null,
  guests: 25,
  ticketType: null,
  contactName: "Анна Иванова",
  phone: "+7 (999) 123-45-67",
  email: "anna@example.com",
  comment: "Нужен <микрофон>",
} as unknown as Application;

const feedback = {
  id: "fb-demo-id",
  name: "Иван Петров",
  email: "ivan@example.com",
  phone: "+7 (999) 000-11-22",
  message: "Хотим уточнить <стоимость>",
} as unknown as Feedback;

test("application guest email is branded html", () => {
  const mail = applicationGuestEmail(application);
  assert.match(mail.subject, /Заявка принята/);
  assert.match(mail.html, /#1C1D24/);
  assert.match(mail.html, /Анна Иванова/);
  assert.match(mail.text, /Номер: app-demo-id/);
});

test("application staff email includes admin link and escapes html", () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = "https://event.karofilm.ru";
  try {
    const mail = applicationStaffEmail(application);
    assert.match(mail.subject, /Новая заявка/);
    assert.match(
      mail.html,
      /https:\/\/event\.karofilm\.ru\/admin\/applications\/app-demo-id/,
    );
    assert.match(mail.html, /Открыть в админке/);
    assert.match(mail.html, /&lt;микрофон&gt;/);
    assert.doesNotMatch(mail.html, /<микрофон>/);
    assert.doesNotMatch(mail.html, /localhost/);
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;
  }
});

test("feedback emails escape content", () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = "https://event.karofilm.ru";
  try {
    const guest = feedbackGuestEmail(feedback);
    const staff = feedbackStaffEmail(feedback);
    assert.match(guest.html, /&lt;стоимость&gt;/);
    assert.match(
      staff.html,
      /https:\/\/event\.karofilm\.ru\/admin\/feedback\/fb-demo-id/,
    );
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;
  }
});
