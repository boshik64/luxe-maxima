export const REPERTOIRE_FILM_LABEL = "Фильм из репертуара";
export const CUSTOM_CONTENT_LABEL = "Свой контент";

export function guestFullName(item: {
  contactName: string;
  contactLastName?: string | null;
}) {
  return [item.contactLastName?.trim(), item.contactName.trim()]
    .filter(Boolean)
    .join(" ");
}

export function contentChoiceLabel(item: {
  wantRepertoireFilm?: boolean | null;
  wantCustomContent?: boolean | null;
  filmName?: string | null;
  watchCustom?: string | null;
}) {
  const parts: string[] = [];
  if (item.wantRepertoireFilm) parts.push(REPERTOIRE_FILM_LABEL);
  if (item.wantCustomContent) parts.push(CUSTOM_CONTENT_LABEL);
  if (parts.length) return parts.join(" · ");
  return item.watchCustom?.trim() || item.filmName?.trim() || "";
}
