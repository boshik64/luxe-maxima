import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";
import { PRODUCTS } from "@/lib/products";
import type { Application, Feedback } from "@prisma/client";

function recipients() {
  return (process.env.NOTIFY_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function transport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });
}

function applicationUrl(id: string) {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/admin/applications/${id}`;
}

function body(application: Application) {
  const product = PRODUCTS[application.productId].title;
  const lines = [
    `Новая заявка: ${product}`,
    `Номер: ${application.id}`,
    `Источник: ${application.source}`,
    `Город: ${application.cityName}`,
    `Кинотеатр: ${application.cinemaName}`,
    application.hallName ? `Зал: ${application.hallName}` : null,
    application.hallFormatName ? `Формат: ${application.hallFormatName}` : null,
    application.hallCapacity ? `Вместимость: ${application.hallCapacity}` : null,
    application.hallRentalPriceWeekday != null ||
    application.hallRentalPriceWeekend != null
      ? `Стоимость аренды: пн–пт ${application.hallRentalPriceWeekday ?? application.hallRentalPrice ?? "—"} ₽, сб–вс ${application.hallRentalPriceWeekend ?? "—"} ₽`
      : application.hallRentalPrice != null
        ? `Стоимость аренды: ${application.hallRentalPrice} ₽`
        : null,
    application.filmName ? `Фильм / контент: ${application.filmName}` : null,
    application.sessionLabel || application.sessionCustom
      ? `Сеанс: ${application.sessionLabel || application.sessionCustom}`
      : null,
    application.productId === "group" && application.rentalDate
      ? `Дата: ${application.rentalDate}`
      : application.rentalStart
      ? `Начало: ${application.rentalStart}`
      : application.rentalDate
        ? `Аренда: ${application.rentalDate} ${application.rentalTime ?? ""} ${application.rentalDuration ?? ""}`.trim()
        : null,
    application.rentalEnd ? `Окончание: ${application.rentalEnd}` : null,
    application.guests ? `Гостей: ${application.guests}` : null,
    application.ticketType ? `Тип билета: ${application.ticketType}` : null,
    `Контакт: ${application.contactName}`,
    `Телефон: ${application.phone}`,
    `Email: ${application.email}`,
    application.comment ? `Комментарий: ${application.comment}` : null,
    `Карточка: ${applicationUrl(application.id)}`,
  ].filter(Boolean);

  return lines.join("\n");
}

export async function notifyNewFeedback(item: Feedback) {
  const to = recipients();
  const mailer = transport();
  if (!to.length || !mailer) {
    logger.info("Email skipped: SMTP or recipients are not configured");
    return;
  }

  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      replyTo: item.email,
      subject: `Обратная связь — ${item.name}`,
      text: [
        `Новое обращение с сайта`,
        `Имя: ${item.name}`,
        `Email: ${item.email}`,
        item.phone ? `Телефон: ${item.phone}` : null,
        `Сообщение:`,
        item.message,
        `Карточка: ${base}/admin/feedback/${item.id}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  } catch (error) {
    logger.error("Failed to send feedback email", error);
  }
}

export async function notifyNewApplication(application: Application) {
  const to = recipients();
  const mailer = transport();
  if (!to.length || !mailer) {
    logger.info("Email skipped: SMTP or recipients are not configured");
    return;
  }

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      replyTo: application.email,
      subject: `Новая заявка — ${PRODUCTS[application.productId].title}`,
      text: body(application),
    });
  } catch (error) {
    logger.error("Failed to send application email", error);
  }
}
