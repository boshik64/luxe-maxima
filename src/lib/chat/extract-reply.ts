/**
 * Оставляет только новый текст ответа гостя, отрезая цитату предыдущих писем.
 * Покрывает Gmail (ru/en), Outlook и типичные «>»-цитаты.
 */
const REPLY_MARKERS: RegExp[] = [
  // Gmail RU: «вт, 3 нояб. 2026 г. в 22:40, <mail@…>:»
  /^[а-яёa-z]{2},\s+\d{1,2}\s+[а-яё.]+\s+\d{4}\s*г\.?\s+в\s+\d{1,2}:\d{2}.*:$/i,
  // Gmail EN: «On Tue, Nov 3, 2026 at 10:40 PM Name <mail@…> wrote:»
  /^on\s+.+\s+wrote:\s*$/i,
  // Outlook / общие
  /^-{2,}\s*original message\s*-{2,}$/i,
  /^-{2,}\s*исходное сообщение\s*-{2,}$/i,
  /^from:\s+.+/i,
  /^от:\s+.+/i,
  /^sent:\s+.+/i,
  /^отправлено:\s+.+/i,
  /^________________________________$/i,
];

function normalizeNewlines(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Gmail часто ставит узкий неразрывный пробел перед «г.»
    .replace(/[\u00a0\u202f\u2007]/g, " ");
}

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function extractLatestReply(raw: string): string {
  const text = normalizeNewlines(raw).trim();
  if (!text) return "";

  const lines = text.split("\n");
  const kept: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (REPLY_MARKERS.some((marker) => marker.test(trimmed))) break;
    // Цитата «> …»
    if (/^>/.test(trimmed)) break;
    kept.push(line);
  }

  return kept.join("\n").trim();
}

export function extractLatestReplyFromParts(options: {
  text?: string | null;
  html?: string | null;
}): string {
  const fromText = options.text?.trim()
    ? extractLatestReply(options.text)
    : "";
  if (fromText) return fromText;

  const fromHtml = options.html?.trim()
    ? extractLatestReply(stripHtml(options.html))
    : "";
  return fromHtml;
}
