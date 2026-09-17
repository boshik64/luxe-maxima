import { fetchCinemaSchedule, fetchDirectory } from "@/lib/karo/client";
import { getEnabledSaleIds } from "@/lib/films/sale-mechanics";
import {
  ART_FILM_CATEGORY_ID,
  CUSTOM_OPTION,
  CUSTOM_SESSION_OPTION,
  karoAssetUrl,
  type FilmOption,
  type KaroFilmMedia,
  type KaroMovie,
  type KaroNestedFilm,
  type ScheduleOption,
  type SessionOption,
} from "@/lib/karo/types";

function withCustom(options: ScheduleOption[], custom = CUSTOM_OPTION) {
  return [...options, custom];
}

function mediaPath(media?: KaroFilmMedia) {
  return karoAssetUrl(
    media?.grid_image?.mobile ||
      media?.grid_image?.desktop ||
      media?.poster_image?.mobile ||
      media?.poster_image?.desktop,
  );
}

function priceRubles(kopecks?: number) {
  if (typeof kopecks !== "number" || !Number.isFinite(kopecks) || kopecks <= 0) {
    return undefined;
  }
  return Math.round(kopecks / 100);
}

function orderingValue(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : Number.POSITIVE_INFINITY;
}

function sortByOrdering<T extends { ordering?: number | null; name: string }>(
  items: T[],
) {
  return [...items].sort((a, b) => {
    const byOrder = orderingValue(a.ordering) - orderingValue(b.ordering);
    if (byOrder !== 0) return byOrder;
    return a.name.localeCompare(b.name, "ru");
  });
}

function movieById(movies: KaroMovie[]) {
  return new Map(movies.map((movie) => [movie.id, movie]));
}

function isSaleAllowed(
  movie: KaroMovie | undefined,
  enabledSaleIds: number[] | null,
) {
  if (!enabledSaleIds) return true;
  const saleId = movie?.sale_id;
  if (typeof saleId !== "number") return false;
  return enabledSaleIds.includes(saleId);
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
  const [directory, enabledSaleIds] = await Promise.all([
    fetchDirectory(),
    getEnabledSaleIds(),
  ]);
  const needle = query.trim().toLowerCase();
  const movies = sortByOrdering(
    (directory.movie ?? [])
      .filter((movie) => movie.film_category_id !== ART_FILM_CATEGORY_ID)
      .filter((movie) => isSaleAllowed(movie, enabledSaleIds))
      .filter((movie) =>
        needle ? movie.name.toLowerCase().includes(needle) : true,
      ),
  );
  return movies.slice(0, 20).map((movie) => ({
    id: String(movie.id),
    name: movie.name,
  }));
}

function toFilmOption(film: KaroNestedFilm): FilmOption {
  return {
    id: String(film.id),
    name: film.name,
    ageRestriction:
      typeof film.age_restriction === "number" ? film.age_restriction : null,
    duration: typeof film.duration === "number" ? film.duration : null,
    posterUrl: mediaPath(film.media),
  };
}

export async function listFilms(
  cinemaId: number,
  query = "",
): Promise<FilmOption[]> {
  const [schedule, directory, enabledSaleIds] = await Promise.all([
    fetchCinemaSchedule(cinemaId),
    fetchDirectory(),
    getEnabledSaleIds(),
  ]);
  const movies = movieById(directory.movie ?? []);
  const needle = query.trim().toLowerCase();

  const films = sortByOrdering(
    (schedule.items ?? [])
      .filter((film) => isSaleAllowed(movies.get(film.id), enabledSaleIds))
      .filter((film) =>
        needle ? film.name.toLowerCase().includes(needle) : true,
      ),
  ).map(toFilmOption);

  const limited = needle ? films.slice(0, 20) : films;
  return [...limited, CUSTOM_OPTION];
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
          genres: Object.values(film.genres ?? {}),
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
