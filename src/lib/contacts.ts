export const KARO_SITE_URL = "https://karofilm.ru";

export const CONTACTS = {
  phoneDisplay: "+7 (495) 980-88-91",
  phoneHref: "tel:+74959808891",
  email: "event@karofilm.ru",
  feedbackEmail: "feedback@karofilm.ru",
  address: "Москва, ул. Новый Арбат, д. 24",
};

export const CONTACT_MAILTO_ID = "default";
export const CONTACT_MAILTO_MAX_SUBJECT = 200;
export const CONTACT_MAILTO_MAX_BODY = 4000;

/** Дефолт темы и тела письма при клике на почту на странице «Контакты». */
export const CONTACT_MAILTO = {
  subject: "Заявка на мероприятие / аренду зала в КАРО",
  body: [
    "Здравствуйте!",
    "",
    "Хочу уточнить возможность проведения мероприятия / аренды зала.",
    "",
    "Город / кинотеатр:",
    "Дата:",
    "Количество гостей:",
    "Формат мероприятия:",
    "Контактный телефон:",
    "",
    "Комментарий:",
  ].join("\n"),
} as const;

export type ContactMailtoContent = {
  subject: string;
  body: string;
};

export function contactMailtoHref(
  email: string = CONTACTS.email,
  options: { subject?: string; body?: string } = {},
) {
  const subject = encodeURIComponent(options.subject ?? CONTACT_MAILTO.subject);
  const body = encodeURIComponent(options.body ?? CONTACT_MAILTO.body);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
