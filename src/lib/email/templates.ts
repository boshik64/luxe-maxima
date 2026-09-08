import type { Application, Feedback } from "@prisma/client";
import { PRODUCTS } from "@/lib/products";
import {
  appBaseUrl,
  escapeHtml,
  renderButton,
  renderDetailRows,
  renderEmailDocument,
} from "@/lib/email/layout";

function productTitle(productId: Application["productId"]) {
  return PRODUCTS[productId]?.title ?? productId;
}

export function applicationDetailRows(application: Application) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Формат", value: productTitle(application.productId) },
    { label: "Номер заявки", value: application.id },
    { label: "Город", value: application.cityName },
    { label: "Кинотеатр", value: application.cinemaName },
  ];

  if (application.hallName) rows.push({ label: "Зал", value: application.hallName });
  if (application.hallFormatName) {
    rows.push({ label: "Формат зала", value: application.hallFormatName });
  }
  if (application.hallCapacity) {
    rows.push({ label: "Вместимость", value: String(application.hallCapacity) });
  }
  if (
    application.hallRentalPriceWeekday != null ||
    application.hallRentalPriceWeekend != null
  ) {
    rows.push({
      label: "Стоимость аренды",
      value: `пн–пт ${application.hallRentalPriceWeekday ?? application.hallRentalPrice ?? "—"} ₽, сб–вс ${application.hallRentalPriceWeekend ?? "—"} ₽`,
    });
  } else if (application.hallRentalPrice != null) {
    rows.push({
      label: "Стоимость аренды",
      value: `${application.hallRentalPrice} ₽`,
    });
  }
  if (application.filmName) {
    rows.push({ label: "Фильм / контент", value: application.filmName });
  }
  if (application.sessionLabel || application.sessionCustom) {
    rows.push({
      label: "Сеанс",
      value: application.sessionLabel || application.sessionCustom || "",
    });
  }
  if (application.rentalStart) {
    rows.push({ label: "Начало", value: application.rentalStart });
  } else if (application.rentalDate) {
    rows.push({
      label: "Аренда",
      value: `${application.rentalDate} ${application.rentalTime ?? ""} ${application.rentalDuration ?? ""}`.trim(),
    });
  }
  if (application.rentalEnd) {
    rows.push({ label: "Окончание", value: application.rentalEnd });
  }
  if (application.guests) {
    rows.push({ label: "Гостей", value: String(application.guests) });
  }
  if (application.ticketType) {
    rows.push({ label: "Тип билета", value: application.ticketType });
  }

  return rows;
}

export function applicationStaffDetailRows(application: Application) {
  return [
    ...applicationDetailRows(application),
    { label: "Контакт", value: application.contactName },
    { label: "Телефон", value: application.phone },
    { label: "Email", value: application.email },
    ...(application.comment
      ? [{ label: "Комментарий", value: application.comment }]
      : []),
    { label: "Источник", value: application.source },
  ];
}

function detailsCard(rows: Array<{ label: string; value: string }>) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:#353545; border-radius:12px;">
      <tr>
        <td style="padding:8px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${renderDetailRows(rows)}
          </table>
        </td>
      </tr>
    </table>`;
}

export function applicationGuestEmail(application: Application) {
  const title = productTitle(application.productId);
  const rows = applicationDetailRows(application);
  const html = renderEmailDocument({
    title: `Заявка принята — ${title}`,
    preheader: `Мы получили вашу заявку «${title}». Менеджер свяжется с вами.`,
    heading: "Заявка принята",
    introHtml: `
      <p style="margin:0 0 10px;">Здравствуйте, ${escapeHtml(application.contactName)}!</p>
      <p style="margin:0;">Мы получили заявку на «${escapeHtml(title)}». Менеджер КАРО свяжется с вами по телефону или email, чтобы уточнить детали.</p>
    `,
    bodyHtml: `
      ${detailsCard(rows)}
      <p style="margin:18px 0 0; font-family:Verdana,sans-serif; font-size:13px; color:#9f968a;">
        Номер заявки: <strong style="color:#e8e6e3;">${escapeHtml(application.id)}</strong>
      </p>
    `,
    footerNote: "Если вы не оставляли заявку, просто проигнорируйте это письмо.",
  });

  const text = [
    `Здравствуйте, ${application.contactName}!`,
    `Мы получили заявку на «${title}».`,
    `Номер: ${application.id}`,
    ...rows.map((row) => `${row.label}: ${row.value}`),
    "Менеджер КАРО свяжется с вами.",
  ].join("\n");

  return {
    subject: `Заявка принята — ${title}`,
    html,
    text,
  };
}

export function applicationStaffEmail(application: Application) {
  const title = productTitle(application.productId);
  const rows = applicationStaffDetailRows(application);
  const cardUrl = `${appBaseUrl()}/admin/applications/${application.id}`;
  const html = renderEmailDocument({
    title: `Новая заявка — ${title}`,
    preheader: `${application.contactName}: ${title}, ${application.cityName}`,
    heading: "Новая заявка",
    introHtml: `<p style="margin:0;">На сайте оставили заявку «${escapeHtml(title)}».</p>`,
    bodyHtml: `
      ${detailsCard(rows)}
      ${renderButton(cardUrl, "Открыть в админке")}
    `,
  });

  const text = [
    `Новая заявка: ${title}`,
    ...rows.map((row) => `${row.label}: ${row.value}`),
    `Карточка: ${cardUrl}`,
  ].join("\n");

  return {
    subject: `Новая заявка — ${title}`,
    html,
    text,
  };
}

export function feedbackGuestEmail(item: Feedback) {
  const html = renderEmailDocument({
    title: "Мы получили ваше обращение",
    preheader: "Обращение принято. Ответим на этот email.",
    heading: "Обращение принято",
    introHtml: `
      <p style="margin:0 0 10px;">Здравствуйте, ${escapeHtml(item.name)}!</p>
      <p style="margin:0;">Мы получили ваше сообщение и ответим на указанный email.</p>
    `,
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background-color:#353545; border-radius:12px; padding:16px;">
        <tr>
          <td style="font-family:Verdana,sans-serif; font-size:13px; color:#9f968a; padding-bottom:8px;">
            Ваше сообщение
          </td>
        </tr>
        <tr>
          <td style="font-family:Verdana,sans-serif; font-size:14px; line-height:1.55; color:#e8e6e3; white-space:pre-wrap;">
            ${escapeHtml(item.message)}
          </td>
        </tr>
      </table>
    `,
    footerNote: "Если вы не отправляли обращение, просто проигнорируйте это письмо.",
  });

  const text = [
    `Здравствуйте, ${item.name}!`,
    "Мы получили ваше сообщение и ответим на этот email.",
    "",
    "Ваше сообщение:",
    item.message,
  ].join("\n");

  return {
    subject: "Мы получили ваше обращение — КАРО",
    html,
    text,
  };
}

export function feedbackStaffEmail(item: Feedback) {
  const cardUrl = `${appBaseUrl()}/admin/feedback/${item.id}`;
  const rows = [
    { label: "Имя", value: item.name },
    { label: "Email", value: item.email },
    ...(item.phone ? [{ label: "Телефон", value: item.phone }] : []),
  ];
  const html = renderEmailDocument({
    title: `Обратная связь — ${item.name}`,
    preheader: item.message.slice(0, 120),
    heading: "Новое обращение",
    introHtml: `<p style="margin:0;">С формы обратной связи пришло сообщение.</p>`,
    bodyHtml: `
      ${detailsCard(rows)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="margin-top:16px; background-color:#353545; border-radius:12px; padding:16px;">
        <tr>
          <td style="font-family:Verdana,sans-serif; font-size:13px; color:#9f968a; padding-bottom:8px;">
            Сообщение
          </td>
        </tr>
        <tr>
          <td style="font-family:Verdana,sans-serif; font-size:14px; line-height:1.55; color:#e8e6e3; white-space:pre-wrap;">
            ${escapeHtml(item.message)}
          </td>
        </tr>
      </table>
      ${renderButton(cardUrl, "Открыть в админке")}
    `,
  });

  const text = [
    "Новое обращение с сайта",
    `Имя: ${item.name}`,
    `Email: ${item.email}`,
    item.phone ? `Телефон: ${item.phone}` : null,
    "Сообщение:",
    item.message,
    `Карточка: ${cardUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Обратная связь — ${item.name}`,
    html,
    text,
  };
}
