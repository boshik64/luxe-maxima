import { fetchCinemaSchedule, fetchDirectory } from "@/lib/karo/client";
import {
  ART_FILM_CATEGORY_ID,
  CUSTOM_OPTION,
  CUSTOM_SESSION_OPTION,
  KARO_STATIC_URL,
  type KaroFilmMedia,
  type ScheduleOption,
  type SessionOption,
} from "@/lib/karo/types";

function withCustom(options: ScheduleOption[], custom = CUSTOM_OPTION) {
  return [...options, custom];
}

function mediaPath(media?: KaroFilmMedia) {
  const path =
    media?.grid_image?.mobile ||
    media?.grid_image?.desktop ||
    media?.poster_image?.mobile ||
    media?.poster_image?.desktop;
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${KARO_STATIC_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function priceRubles(kopecks?: number) {
  if (typeof kopecks !== "number" || !Number.isFinite(kopecks) || kopecks <= 0) {
    return undefined;
  }
  return Math.round(kopecks / 100);
}

export async function listHalls(cinemaId: number): Promise<ScheduleOption[]> {
  const [schedule, directory] = await Promise.all([
    fetchCinemaSchedule(cinemaId),
    fetchDirectory(),
  ]);
  const hallAttributes = directory.attributes.filter((item) => item.type === "format");

  const presentIds = new Set<number>();
  for (const film of schedule.items ?? []) {
    for (const format of film.formats ?? []) {
      for (const session of format.sessions ?? []) {
        for (const attributeId of session.attributes ?? []) {
          presentIds.add(attributeId);
        }
      }
    }
  }

  const halls = hallAttributes
    .filter((attribute) => presentIds.has(attribute.id))
    .map((attribute) => ({ id: String(attribute.id), name: attribute.name }));

  if (halls.length === 0) {
    return withCustom(
      hallAttributes.map((attribute) => ({
        id: String(attribute.id),
        name: attribute.name,
      })),
    );
  }

  return withCustom(halls);
}

export async function searchRepertoire(query = ""): Promise<ScheduleOption[]> {
  const directory = await fetchDirectory();
  const needle = query.trim().toLowerCase();
  return (directory.movie ?? [])
    .filter((movie) => movie.film_category_id !== ART_FILM_CATEGORY_ID)
    .filter((movie) =>
      needle ? movie.name.toLowerCase().includes(needle) : true,
    )
    .slice(0, 20)
    .map((movie) => ({ id: String(movie.id), name: movie.name }));
}

export async function listFilms(
  cinemaId: number,
  query = "",
): Promise<ScheduleOption[]> {
  const schedule = await fetchCinemaSchedule(cinemaId);
  const needle = query.trim().toLowerCase();
  const films = (schedule.items ?? [])
    .map((film) => ({
      id: String(film.id),
      name: film.name,
    }))
    .filter((film) => (needle ? film.name.toLowerCase().includes(needle) : true))
    .slice(0, 20);
  return withCustom(films);
}

export async function listSessions(
  cinemaId: number,
  filters: { hallId?: string; filmId?: string },
): Promise<SessionOption[]> {
  const [schedule, directory] = await Promise.all([
    fetchCinemaSchedule(cinemaId),
    fetchDirectory(),
  ]);
  const attributes = directory.attributes ?? [];
  const hallAttributes = attributes.filter((item) => item.type === "format");
  const attributeName = new Map(attributes.map((item) => [item.id, item]));

  const hallNumericId = filters.hallId ? Number(filters.hallId) : NaN;
  const filmId = filters.filmId;
  const sessions: SessionOption[] = [];

  for (const film of schedule.items ?? []) {
    if (filmId && String(film.id) !== filmId) continue;
    for (const format of film.formats ?? []) {
      for (const session of format.sessions ?? []) {
        if (
          Number.isFinite(hallNumericId) &&
          !(session.attributes ?? []).includes(hallNumericId)
        ) {
          continue;
        }
        const hallName =
          hallAttributes.find((item) =>
            (session.attributes ?? []).includes(item.id),
          )?.name ?? format.format_name;
        const dateLabel = session.date.split("-").reverse().join(".");
        const tags = (session.attributes ?? [])
          .map((id) => attributeName.get(id))
          .filter((item) => item && item.type !== "format")
          .map((item) => item!.name)
          .slice(0, 3);
        sessions.push({
          id: String(session.id),
          name: `${dateLabel} ${session.time} — ${film.name}`,
          showtime: session.showtime,
          filmName: film.name,
          hallName,
          formatName: format.format_name,
          price: priceRubles(session.standard_price),
          ageRestriction:
            typeof film.age_restriction === "number" ? film.age_restriction : null,
          duration: typeof film.duration === "number" ? film.duration : null,
          posterUrl: mediaPath(film.media),
          tags,
        });
      }
    }
  }

  sessions.sort((a, b) => a.showtime.localeCompare(b.showtime));
  return [
    ...sessions,
    {
      id: CUSTOM_SESSION_OPTION.id,
      name: CUSTOM_SESSION_OPTION.name,
      showtime: "",
      filmName: "",
      hallName: "",
    },
  ];
}
