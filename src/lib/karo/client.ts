import { logger } from "@/lib/logger";
import type {
  KaroAttribute,
  KaroCinema,
  KaroCity,
  KaroMovie,
  KaroNestedFilm,
} from "@/lib/karo/types";

const API_URL = (process.env.KARO_API_URL ?? "https://api.karofilm.ru").replace(
  /\/$/,
  "",
);

type KaroEnvelope<T> = {
  result?: number;
  error?: string;
  data?: T;
};

type CacheEntry<T> = { expiresAt: number; value: T };

const cache = new Map<string, CacheEntry<unknown>>();
const TTL_MS = 5 * 60 * 1000;

async function karoGet<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    logger.error("KARO API HTTP error", { url, status: response.status });
    throw new Error("Не удалось получить данные расписания");
  }

  const payload = (await response.json()) as KaroEnvelope<T>;
  if (payload.result && payload.result !== 0) {
    logger.error("KARO API application error", { url, error: payload.error });
    throw new Error(payload.error || "Ошибка API КАРО");
  }

  const data = payload.data as T;
  cache.set(url, { expiresAt: Date.now() + TTL_MS, value: data });
  return data;
}

export async function fetchCities(): Promise<KaroCity[]> {
  const data = await karoGet<KaroCity[]>("/city");
  return [...data].sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0));
}

export async function fetchCinemas(cityId: number): Promise<KaroCinema[]> {
  const data = await karoGet<KaroCinema[]>(`/cinema-list?city_id=${cityId}`);
  return data;
}

type Directory = {
  attributes: KaroAttribute[];
  movie: KaroMovie[];
};

export async function fetchDirectory(): Promise<Directory> {
  return karoGet<Directory>("/directory");
}

export async function fetchHallAttributes(): Promise<KaroAttribute[]> {
  const directory = await fetchDirectory();
  return directory.attributes.filter((item) => item.type === "format");
}

export async function fetchCinemaSchedule(cinemaId: number): Promise<{
  items: KaroNestedFilm[];
}> {
  return karoGet<{ items: KaroNestedFilm[] }>(
    `/cinema-schedule?cinema_id=${cinemaId}`,
  );
}
