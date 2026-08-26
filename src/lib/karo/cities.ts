import { fetchCinemas, fetchCities } from "@/lib/karo/client";

/** Официальные гербы городов (Wikimedia Commons). */
const CITY_CREST_BY_ID: Record<string, string> = {
  "1": "/cities/moscow.svg",
  "2": "/cities/spb.svg",
  "5": "/cities/ekaterinburg.svg",
  "7": "/cities/kaliningrad.svg",
  "9": "/cities/samara.svg",
  "10": "/cities/surgut.svg",
  "12": "/cities/tyumen.svg",
  "13": "/cities/novosibirsk.svg",
  "14": "/cities/krasnodar.png",
};

export type CityOption = {
  id: string;
  name: string;
  cinemaCount: number;
  crestUrl: string;
};

export function cityCrestUrl(cityId: string) {
  return CITY_CREST_BY_ID[cityId] ?? "/cities/moscow.svg";
}

export async function listCitiesWithCinemaCounts(): Promise<CityOption[]> {
  const cities = await fetchCities();
  const counts = await Promise.all(
    cities.map(async (city) => {
      try {
        const cinemas = await fetchCinemas(city.id);
        return cinemas.length;
      } catch {
        return 0;
      }
    }),
  );

  return cities.map((city, index) => ({
    id: String(city.id),
    name: city.name,
    cinemaCount: counts[index] ?? 0,
    crestUrl: cityCrestUrl(String(city.id)),
  }));
}

function cinemaWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "кинотеатр";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "кинотеатра";
  return "кинотеатров";
}

export function formatCinemaCount(count: number) {
  return `${count} ${cinemaWord(count)}`;
}
