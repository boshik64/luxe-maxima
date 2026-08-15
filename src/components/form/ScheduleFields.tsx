"use client";

import { useEffect, useState } from "react";
import {
  CascadeSelect,
  type CascadeValue,
} from "@/components/form/CascadeSelect";
import { FilmSearch } from "@/components/form/FilmSearch";
import {
  CUSTOM_OPTION,
  CUSTOM_OPTION_ID,
  type ScheduleOption,
} from "@/lib/karo/types";
import { PRODUCTS, type ProductId } from "@/lib/products";

const empty: CascadeValue = { id: "", name: "", custom: "" };

async function loadOptions(url: string): Promise<ScheduleOption[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("schedule");
  const data = (await response.json()) as { items: ScheduleOption[] };
  return data.items;
}

function isCatalogId(id: string) {
  return Boolean(id) && id !== CUSTOM_OPTION_ID;
}

export function ScheduleFields({
  productId,
  errors,
  onChange,
}: {
  productId: ProductId;
  errors: Record<string, string>;
  onChange: (value: {
    city: CascadeValue;
    cinema: CascadeValue;
    hall: CascadeValue;
    film: CascadeValue;
    session: CascadeValue;
  }) => void;
}) {
  const config = PRODUCTS[productId];
  const [city, setCity] = useState(empty);
  const [cinema, setCinema] = useState(empty);
  const [hall, setHall] = useState(empty);
  const [film, setFilm] = useState(empty);
  const [session, setSession] = useState(empty);
  const [cities, setCities] = useState<ScheduleOption[]>([]);
  const [cinemas, setCinemas] = useState<ScheduleOption[]>([]);
  const [halls, setHalls] = useState<ScheduleOption[]>([]);
  const [sessions, setSessions] = useState<ScheduleOption[]>([]);
  const [loading, setLoading] = useState({
    cities: true,
    cinemas: false,
    halls: false,
    sessions: false,
  });
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadOptions("/api/schedule/cities")
      .then((items) => {
        if (!cancelled) setCities(items);
      })
      .catch(() => {
        if (!cancelled) {
          setCities([CUSTOM_OPTION]);
          setScheduleError(
            "Расписание временно недоступно. Укажите город и кинотеатр вручную.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading((state) => ({ ...state, cities: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isCatalogId(city.id)) return;
    let cancelled = false;
    loadOptions(`/api/schedule/cinemas?cityId=${city.id}`)
      .then((items) => {
        if (!cancelled) {
          setCinemas(items);
          setScheduleError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCinemas([CUSTOM_OPTION]);
          setScheduleError(
            "Не удалось загрузить кинотеатры. Можно указать свой вариант.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading((state) => ({ ...state, cinemas: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [city.id]);

  useEffect(() => {
    if (!isCatalogId(cinema.id)) return;
    let cancelled = false;
    const tasks: Promise<void>[] = [];
    if (config.fields.hall) {
      tasks.push(
        loadOptions(`/api/schedule/halls?cinemaId=${cinema.id}`)
          .then((items) => {
            if (!cancelled) setHalls(items);
          })
          .catch(() => {
            if (!cancelled) setHalls([CUSTOM_OPTION]);
          })
          .finally(() => {
            if (!cancelled) setLoading((state) => ({ ...state, halls: false }));
          }),
      );
    }
    void Promise.all(tasks);
    return () => {
      cancelled = true;
    };
  }, [cinema.id, config.fields.hall]);

  useEffect(() => {
    if (!config.fields.session || !isCatalogId(cinema.id)) return;
    const params = new URLSearchParams({ cinemaId: cinema.id });
    if (isCatalogId(film.id)) params.set("filmId", film.id);
    if (isCatalogId(hall.id)) params.set("hallId", hall.id);
    let cancelled = false;
    loadOptions(`/api/schedule/sessions?${params.toString()}`)
      .then((items) => {
        if (!cancelled) setSessions(items);
      })
      .catch(() => {
        if (!cancelled) {
          setSessions([
            {
              id: CUSTOM_OPTION_ID,
              name: "Не нашел подходящий сеанс / свое время",
            },
          ]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading((state) => ({ ...state, sessions: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [cinema.id, film.id, hall.id, config.fields.session]);

  function emit(next: {
    city: CascadeValue;
    cinema: CascadeValue;
    hall: CascadeValue;
    film: CascadeValue;
    session: CascadeValue;
  }) {
    onChange(next);
  }

  return (
    <div className="space-y-5">
      {scheduleError ? (
        <p className="text-sm text-gold" role="status">
          {scheduleError}
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <CascadeSelect
          id="city"
          label="Город"
          required
          value={city}
          options={cities}
          loading={loading.cities}
          errorId={errors["city.id"]}
          errorCustom={errors["city.custom"]}
          onChange={(value) => {
            setCity(value);
            setCinema(empty);
            setHall(empty);
            setFilm(empty);
            setSession(empty);
            setCinemas(isCatalogId(value.id) ? [] : [CUSTOM_OPTION]);
            setHalls([CUSTOM_OPTION]);
            setSessions([
              {
                id: CUSTOM_OPTION_ID,
                name: "Не нашел подходящий сеанс / свое время",
              },
            ]);
            setLoading((state) => ({
              ...state,
              cinemas: isCatalogId(value.id),
              halls: false,
              sessions: false,
            }));
            emit({
              city: value,
              cinema: empty,
              hall: empty,
              film: empty,
              session: empty,
            });
          }}
        />
        <CascadeSelect
          id="cinema"
          label="Кинотеатр"
          required
          value={cinema}
          options={cinemas}
          loading={loading.cinemas}
          disabled={!city.id}
          errorId={errors["cinema.id"]}
          errorCustom={errors["cinema.custom"]}
          onChange={(value) => {
            setCinema(value);
            setHall(empty);
            setFilm(empty);
            setSession(empty);
            const manual = !isCatalogId(value.id);
            setHalls(manual ? [CUSTOM_OPTION] : []);
            setSessions(
              manual
                ? [
                    {
                      id: CUSTOM_OPTION_ID,
                      name: "Не нашел подходящий сеанс / свое время",
                    },
                  ]
                : [],
            );
            setLoading((state) => ({
              ...state,
              halls: config.fields.hall && isCatalogId(value.id),
              sessions: false,
            }));
            emit({
              city,
              cinema: value,
              hall: empty,
              film: empty,
              session: empty,
            });
          }}
        />
        {config.fields.hall ? (
          <CascadeSelect
            id="hall"
            label="Зал"
            required
            value={hall}
            options={halls}
            loading={loading.halls}
            disabled={!cinema.id}
            errorId={errors["hall.id"]}
            errorCustom={errors["hall.custom"]}
            onChange={(value) => {
              setHall(value);
              setSession(empty);
              setLoading((state) => ({
                ...state,
                sessions: config.fields.session && isCatalogId(cinema.id),
              }));
              emit({ city, cinema, hall: value, film, session: empty });
            }}
          />
        ) : null}
        {config.fields.film ? (
          <FilmSearch
            id="film"
            label="Фильм"
            value={film}
            required={false}
            allowCustom
            disabled={!cinema.id}
            error={errors["film.id"]}
            errorCustom={errors["film.custom"]}
            endpoint={
              isCatalogId(cinema.id)
                ? `/api/schedule/films?cinemaId=${cinema.id}`
                : cinema.id === CUSTOM_OPTION_ID
                  ? "/api/schedule/repertoire"
                  : null
            }
            onChange={(value) => {
              setFilm(value);
              setSession(empty);
              setLoading((state) => ({
                ...state,
                sessions: config.fields.session && isCatalogId(cinema.id),
              }));
              emit({ city, cinema, hall, film: value, session: empty });
            }}
          />
        ) : null}
        {config.fields.session ? (
          <CascadeSelect
            id="session"
            label="Сеанс"
            required
            value={session}
            options={sessions}
            loading={loading.sessions}
            disabled={!cinema.id}
            errorId={errors["session.id"]}
            errorCustom={errors["session.custom"]}
            onChange={(value) => {
              setSession(value);
              emit({ city, cinema, hall, film, session: value });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
