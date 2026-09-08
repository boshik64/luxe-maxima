import { CONTACTS, KARO_SITE_URL } from "@/lib/contacts";

export const EMAIL = {
  bg: "#1C1D24",
  card: "#2a2a37",
  cardSoft: "#353545",
  text: "#e8e6e3",
  muted: "#9f968a",
  red: "#e91a3b",
  redDeep: "#b8122c",
  white: "#ffffff",
  width: 540,
  logo: "https://static.karofilm.ru/v3k/uploads/filemanager/email_templates/default/logored.png",
} as const;

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Public site origin for links in staff emails («Открыть в админке»). */
export function appBaseUrl() {
  const raw = process.env.APP_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

type DetailRow = { label: string; value: string };

export function renderDetailRows(rows: DetailRow[]) {
  return rows
    .map(
      (row) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #44444f; font-family:Verdana,sans-serif; font-size:13px; color:${EMAIL.muted}; width:38%; vertical-align:top;">
          ${escapeHtml(row.label)}
        </td>
        <td style="padding:10px 0; border-bottom:1px solid #44444f; font-family:Verdana,sans-serif; font-size:14px; color:${EMAIL.text}; vertical-align:top;">
          ${escapeHtml(row.value)}
        </td>
      </tr>`,
    )
    .join("");
}

export function renderButton(href: string, label: string) {
  return `
    <table cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px;">
      <tr>
        <td align="center" bgcolor="${EMAIL.redDeep}" style="border-radius:999px; background-color:${EMAIL.redDeep};">
          <a href="${escapeHtml(href)}" target="_blank"
             style="display:inline-block; padding:14px 28px; font-family:Verdana,sans-serif; font-size:14px; font-weight:700; color:${EMAIL.white}; text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

export function renderEmailDocument(options: {
  title: string;
  preheader?: string;
  heading: string;
  introHtml: string;
  bodyHtml: string;
  footerNote?: string;
}) {
  const preheader = options.preheader
    ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
        ${escapeHtml(options.preheader)}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru" style="padding:0; margin:0;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0; padding:0; background-color:${EMAIL.bg}; font-family:Verdana,sans-serif;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL.bg};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="${EMAIL.width}" cellpadding="0" cellspacing="0" style="width:100%; max-width:${EMAIL.width}px;">
          <tr>
            <td align="center" style="padding:8px 0 28px;">
              <a href="${KARO_SITE_URL}" target="_blank" style="text-decoration:none;">
                <img src="${EMAIL.logo}" width="157" alt="КАРО" style="display:block; border:0;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="background-color:${EMAIL.card}; border-radius:16px; padding:28px 24px;">
              <h1 style="margin:0 0 12px; font-family:Verdana,sans-serif; font-size:22px; line-height:1.3; font-weight:700; color:${EMAIL.white};">
                ${escapeHtml(options.heading)}
              </h1>
              <div style="font-family:Verdana,sans-serif; font-size:14px; line-height:1.55; color:${EMAIL.muted};">
                ${options.introHtml}
              </div>
              <div style="margin-top:22px;">
                ${options.bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 8px 8px; font-family:Verdana,sans-serif; font-size:12px; line-height:1.5; color:${EMAIL.muted};">
              ${
                options.footerNote
                  ? `<p style="margin:0 0 12px;">${escapeHtml(options.footerNote)}</p>`
                  : ""
              }
              <p style="margin:0 0 6px;">
                <a href="mailto:${CONTACTS.email}" style="color:${EMAIL.red}; text-decoration:underline;">${CONTACTS.email}</a>
                ·
                <a href="${CONTACTS.phoneHref}" style="color:${EMAIL.muted}; text-decoration:none;">${CONTACTS.phoneDisplay}</a>
              </p>
              <p style="margin:0;">© 2007–2026 «КАРО Фильм Менеджмент»</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
