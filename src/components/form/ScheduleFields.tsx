"use client";

import { useEffect, useState } from "react";
import {
  CascadeSelect,
  type CascadeValue,
} from "@/components/form/CascadeSelect";
import { FilmSearch } from "@/components/form/FilmSearch";
import { Field, inputClassName } from "@/components/form/Field";
import { SessionCards } from "@/components/form/SessionCards";
import {
  CUSTOM_OPTION,
  CUSTOM_OPTION_ID,
  CUSTOM_SESSION_OPTION,
  type ScheduleOption,
  type SessionOption,
} from "@/lib/karo/types";
import { PRODUCTS, type ProductId } from "@/lib/products";

const empty: CascadeValue = { id: "", name: "", custom: "" };

async function loadOptions(url: string): Promise<ScheduleOption[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("schedule");
  const data = (await response.json()) as { items: ScheduleOption[] };
  return data.items;
}

async function loadSessions(url: string): Promise<SessionOption[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("schedule");
  const data = (await response.json()) as { items: SessionOption[] };
  return data.items;
}

const customSession: SessionOption = {
  id: CUSTOM_SESSION_OPTION.id,
  name: CUSTOM_SESSION_OPTION.name,
  showtime: "",
  filmName: "",
  hallName: "",
};

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
  const [sessions, setSessions] = useState<SessionOption[]>([]);
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
    loadSessions(`/api/schedule/sessions?${params.toString()}`)
      .then((items) => {
        if (!cancelled) setSessions(items);
      })
      .catch(() => {
        if (!cancelled) {
          setSessions([customSession]);
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
            setSessions([customSession]);
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
            setSessions(manual ? [customSession] : []);
            setLoading((state) => ({
              ...state,
              halls: config.fields.hall && isCatalogId(value.id),
              sessions: config.fields.session && isCatalogId(value.id),
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
      </div>
      {config.fields.session && cinema.id ? (
        <div className="space-y-3">
          <SessionCards
            sessions={sessions}
            selectedId={session.id}
            loading={loading.sessions}
            error={errors["session.id"]}
            onSelect={(item) => {
              const next = item
                ? { id: item.id, name: item.name, custom: "" }
                : empty;
              setSession(next);
              emit({ city, cinema, hall, film, session: next });
            }}
          />
          <button
            type="button"
            disabled={loading.sessions}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              session.id === CUSTOM_OPTION_ID
                ? "border-primary text-primary"
                : "border-line text-muted hover:border-gold hover:text-foreground"
            } disabled:opacity-60`}
            onClick={() => {
              const next =
                session.id === CUSTOM_OPTION_ID
                  ? empty
                  : { id: CUSTOM_OPTION_ID, name: "", custom: session.custom };
              setSession(next);
              emit({ city, cinema, hall, film, session: next });
            }}
          >
            {CUSTOM_SESSION_OPTION.name}
          </button>
          {session.id === CUSTOM_OPTION_ID ? (
            <Field
              id="session-custom"
              label="Своё время или сеанс"
              error={errors["session.custom"]}
              required
            >
              <input
                id="session-custom"
                className={inputClassName}
                value={session.custom}
                placeholder="Например, суббота вечером"
                onChange={(event) => {
                  const next = {
                    id: CUSTOM_OPTION_ID,
                    name: "",
                    custom: event.target.value,
                  };
                  setSession(next);
                  emit({ city, cinema, hall, film, session: next });
                }}
              />
            </Field>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
