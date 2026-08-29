"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CascadeSelect,
  type CascadeValue,
} from "@/components/form/CascadeSelect";
import { CinemaCard } from "@/components/form/CinemaCard";
import { DatePicker, todayIso } from "@/components/form/DatePicker";
import { FilmSearch } from "@/components/form/FilmSearch";
import { Field, FormStep, inputClassName } from "@/components/form/Field";
import { SessionCards } from "@/components/form/SessionCards";
import {
  CUSTOM_OPTION,
  CUSTOM_OPTION_ID,
  CUSTOM_SESSION_OPTION,
  type CinemaOption,
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

async function loadCinemas(url: string): Promise<CinemaOption[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("schedule");
  const data = (await response.json()) as { items: CinemaOption[] };
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

function sessionDate(session: SessionOption) {
  return session.showtime.slice(0, 10);
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
    sessionDate: string;
  }) => void;
}) {
  const config = PRODUCTS[productId];
  const [city, setCity] = useState(empty);
  const [cinema, setCinema] = useState(empty);
  const [hall, setHall] = useState(empty);
  const [film, setFilm] = useState(empty);
  const [session, setSession] = useState(empty);
  const [sessionDateValue, setSessionDateValue] = useState("");
  const [cities, setCities] = useState<ScheduleOption[]>([]);
  const [cinemas, setCinemas] = useState<CinemaOption[]>([]);
  const [halls, setHalls] = useState<ScheduleOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState({
    cities: true,
    cinemas: false,
    halls: false,
    sessions: false,
  });
  const [scheduleError, setScheduleError] = useState("");

  const selectedCinema = cinemas.find((item) => item.id === cinema.id) ?? {
    id: cinema.id,
    name: cinema.id === CUSTOM_OPTION_ID ? cinema.custom || cinema.name : cinema.name,
    address: "",
    coverUrl: null,
    formats: [],
  };

  const catalogSessions = useMemo(
    () => sessions.filter((item) => item.id !== CUSTOM_OPTION_ID),
    [sessions],
  );
  const filmMeta = catalogSessions[0] ?? null;
  const markedDates = useMemo(
    () => [...new Set(catalogSessions.map(sessionDate).filter(Boolean))],
    [catalogSessions],
  );
  const sessionsOnDate = useMemo(
    () => catalogSessions.filter((item) => sessionDate(item) === sessionDateValue),
    [catalogSessions, sessionDateValue],
  );
  const cityReady = isCatalogId(city.id) || (city.id === CUSTOM_OPTION_ID && Boolean(city.custom.trim()));
  const cinemaReady =
    isCatalogId(cinema.id) || (cinema.id === CUSTOM_OPTION_ID && Boolean(cinema.custom.trim()));
  const filmReady =
    isCatalogId(film.id) || (film.id === CUSTOM_OPTION_ID && Boolean(film.custom.trim()));
  const dateReady = Boolean(sessionDateValue);
  const showCinemaCard = cinemaReady && filmReady;

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
    loadCinemas(`/api/schedule/cinemas?cityId=${city.id}`)
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
    if (!config.fields.session || !isCatalogId(cinema.id) || !isCatalogId(film.id)) {
      return;
    }
    const params = new URLSearchParams({ cinemaId: cinema.id, filmId: film.id });
    if (isCatalogId(hall.id)) params.set("hallId", hall.id);
    let cancelled = false;
    loadSessions(`/api/schedule/sessions?${params.toString()}`)
      .then((items) => {
        if (!cancelled) setSessions(items);
      })
      .catch(() => {
        if (!cancelled) setSessions([customSession]);
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
    sessionDate: string;
  }) {
    onChange(next);
  }

  function handleSessionDateChange(next: string) {
    const stays =
      session.id === CUSTOM_OPTION_ID
        ? session
        : catalogSessions.some(
              (item) => item.id === session.id && sessionDate(item) === next,
            )
          ? session
          : empty;
    setSessionDateValue(next);
    setSession(stays);
    emit({
      city,
      cinema,
      hall,
      film,
      session: stays,
      sessionDate: next,
    });
  }

  return (
    <div className="space-y-5">
      {scheduleError ? (
        <p className="text-sm text-gold" role="status">
          {scheduleError}
        </p>
      ) : null}
      <FormStep show>
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
            setSessionDateValue("");
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
              sessionDate: "",
            });
          }}
        />
      </FormStep>
      <FormStep show={cityReady}>
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
            setSessionDateValue("");
            const manual = !isCatalogId(value.id);
            setHalls(manual ? [CUSTOM_OPTION] : []);
            setSessions(manual ? [customSession] : []);
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
              sessionDate: "",
            });
          }}
        />
      </FormStep>
      {config.fields.hall ? (
        <FormStep show={cinemaReady}>
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
              emit({
                city,
                cinema,
                hall: value,
                film,
                session: empty,
                sessionDate: sessionDateValue,
              });
            }}
          />
        </FormStep>
      ) : null}
      {config.fields.film ? (
        <FormStep show={cinemaReady}>
          <FilmSearch
            id="film"
            label="Фильм"
            value={film}
            required
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
              setSessionDateValue("");
              setSessions(isCatalogId(value.id) ? [] : [customSession]);
              setLoading((state) => ({
                ...state,
                sessions: config.fields.session && isCatalogId(cinema.id) && isCatalogId(value.id),
              }));
              emit({
                city,
                cinema,
                hall,
                film: value,
                session: empty,
                sessionDate: "",
              });
            }}
          />
        </FormStep>
      ) : null}
      {showCinemaCard ? (
        <FormStep show>
          <CinemaCard
            cinema={selectedCinema}
            filmName={film.id === CUSTOM_OPTION_ID ? film.custom : film.name}
            session={filmMeta}
          />
        </FormStep>
      ) : null}
      {config.fields.session ? (
        <FormStep show={filmReady}>
          <Field id="session-date" label="Дата" required error={errors.rentalDate}>
            <DatePicker
              id="session-date"
              value={sessionDateValue}
              min={todayIso()}
              markedDates={markedDates}
              disabled={loading.sessions}
              invalid={Boolean(errors.rentalDate)}
              onChange={handleSessionDateChange}
            />
          </Field>
        </FormStep>
      ) : null}
      {config.fields.session ? (
        <FormStep show={filmReady && dateReady}>
          <div className="space-y-3">
            {sessionDateValue ? (
              <>
                <SessionCards
                  sessions={sessionsOnDate}
                  selectedId={session.id}
                  loading={loading.sessions}
                  error={errors["session.id"]}
                  onSelect={(item) => {
                    const next = item
                      ? { id: item.id, name: item.name, custom: "" }
                      : empty;
                    setSession(next);
                    emit({
                      city,
                      cinema,
                      hall,
                      film,
                      session: next,
                      sessionDate: sessionDateValue,
                    });
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
                    emit({
                      city,
                      cinema,
                      hall,
                      film,
                      session: next,
                      sessionDate: sessionDateValue,
                    });
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
                        emit({
                          city,
                          cinema,
                          hall,
                          film,
                          session: next,
                          sessionDate: sessionDateValue,
                        });
                      }}
                    />
                  </Field>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted">
                Выберите дату — появятся сеансы на этот день.
              </p>
            )}
          </div>
        </FormStep>
      ) : null}
    </div>
  );
}
