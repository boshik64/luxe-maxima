"use client";

import { useEffect, useMemo, useState } from "react";
import { type CascadeValue } from "@/components/form/CascadeSelect";
import { DatePicker, todayIso } from "@/components/form/DatePicker";
import { Field, FormStep } from "@/components/form/Field";
import { CardRow, PickCard } from "@/components/form/PickCards";
import { GroupTerms } from "@/components/landing/GroupTerms";
import { formatCinemaCount } from "@/lib/karo/cities";
import {
  CUSTOM_OPTION_ID,
  karoSessionOrderUrl,
  type CinemaOption,
  type FilmOption,
  type ScheduleOption,
  type SessionOption,
} from "@/lib/karo/types";

type CityCardOption = ScheduleOption & {
  cinemaCount?: number;
  crestUrl?: string;
};

const empty: CascadeValue = { id: "", name: "", custom: "" };

function isCatalogId(id: string) {
  return Boolean(id) && id !== CUSTOM_OPTION_ID;
}

function sessionDate(session: SessionOption) {
  return session.showtime.slice(0, 10);
}

function sessionTime(session: SessionOption) {
  if (session.showtime.includes(" ")) {
    return session.showtime.split(" ")[1]?.slice(0, 5) || "";
  }
  return session.showtime.slice(11, 16);
}

function catalogOnly<T extends { id: string }>(items: T[]) {
  return items.filter((item) => item.id !== CUSTOM_OPTION_ID);
}

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("schedule");
  return response.json() as Promise<T>;
}

export function GroupTicketFlow() {
  const [city, setCity] = useState(empty);
  const [cinema, setCinema] = useState(empty);
  const [film, setFilm] = useState(empty);
  const [sessionDateValue, setSessionDateValue] = useState("");
  const [cities, setCities] = useState<CityCardOption[]>([]);
  const [cinemas, setCinemas] = useState<CinemaOption[]>([]);
  const [films, setFilms] = useState<FilmOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState({
    cities: true,
    cinemas: false,
    films: false,
    sessions: false,
  });
  const [error, setError] = useState("");

  const cinemaList = useMemo(() => catalogOnly(cinemas), [cinemas]);
  const filmList = useMemo(() => catalogOnly(films), [films]);
  const catalogSessions = useMemo(() => catalogOnly(sessions), [sessions]);
  const markedDates = useMemo(
    () => [...new Set(catalogSessions.map(sessionDate).filter(Boolean))],
    [catalogSessions],
  );
  const sessionsOnDate = useMemo(
    () => catalogSessions.filter((item) => sessionDate(item) === sessionDateValue),
    [catalogSessions, sessionDateValue],
  );

  useEffect(() => {
    let cancelled = false;
    loadJson<{ items: CityCardOption[] }>("/api/schedule/cities")
      .then((data) => {
        if (!cancelled) setCities(catalogOnly(data.items));
      })
      .catch(() => {
        if (!cancelled) setError("Расписание временно недоступно. Попробуйте позже.");
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
    loadJson<{ items: CinemaOption[] }>(`/api/schedule/cinemas?cityId=${city.id}`)
      .then((data) => {
        if (!cancelled) {
          setCinemas(data.items);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить кинотеатры.");
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
    loadJson<{ items: FilmOption[] }>(`/api/schedule/films?cinemaId=${cinema.id}`)
      .then((data) => {
        if (!cancelled) setFilms(data.items);
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить фильмы.");
      })
      .finally(() => {
        if (!cancelled) setLoading((state) => ({ ...state, films: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [cinema.id]);

  useEffect(() => {
    if (!isCatalogId(cinema.id) || !isCatalogId(film.id)) return;
    let cancelled = false;
    const params = new URLSearchParams({ cinemaId: cinema.id, filmId: film.id });
    loadJson<{ items: SessionOption[] }>(`/api/schedule/sessions?${params}`)
      .then((data) => {
        if (!cancelled) setSessions(data.items);
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить сеансы.");
      })
      .finally(() => {
        if (!cancelled) setLoading((state) => ({ ...state, sessions: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [cinema.id, film.id]);

  function buySession(session: SessionOption) {
    window.open(karoSessionOrderUrl(session.id), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Выберите кинотеатр, фильм и сеанс. Покупка откроется на сайте КАРО — нужна программа лояльности КАРОНА.
      </p>
      {error ? (
        <p className="text-sm text-gold" role="status">
          {error}
        </p>
      ) : null}
      <FormStep show>
        {loading.cities ? (
          <p className="text-sm text-muted">Загружаем города…</p>
        ) : cities.length ? (
          <CardRow label="Город" count={cities.length}>
            {cities.map((item) => (
              <PickCard
                key={item.id}
                selected={item.id === city.id}
                title={item.name}
                crestUrl={item.crestUrl}
                lines={[formatCinemaCount(item.cinemaCount ?? 0)]}
                action={item.id === city.id ? "Выбран" : "Выбрать"}
                onClick={() => {
                  setCity({ id: item.id, name: item.name, custom: "" });
                  setCinema(empty);
                  setFilm(empty);
                  setSessionDateValue("");
                  setCinemas([]);
                  setFilms([]);
                  setSessions([]);
                  setLoading((state) => ({
                    ...state,
                    cinemas: true,
                    films: false,
                    sessions: false,
                  }));
                }}
              />
            ))}
          </CardRow>
        ) : (
          <p className="text-sm text-muted">Города временно недоступны.</p>
        )}
      </FormStep>
      <FormStep show={isCatalogId(city.id)}>
        {loading.cinemas ? (
          <p className="text-sm text-muted">Загружаем кинотеатры…</p>
        ) : cinemaList.length ? (
          <CardRow label="Кинотеатр" count={cinemaList.length}>
            {cinemaList.map((item) => (
              <PickCard
                key={item.id}
                selected={item.id === cinema.id}
                title={item.name}
                lines={item.address ? [item.address] : []}
                action={item.id === cinema.id ? "Выбран" : "Выбрать"}
                onClick={() => {
                  setCinema({ id: item.id, name: item.name, custom: "" });
                  setFilm(empty);
                  setSessionDateValue("");
                  setFilms([]);
                  setSessions([]);
                  setLoading((state) => ({ ...state, films: true, sessions: false }));
                }}
              />
            ))}
          </CardRow>
        ) : (
          <p className="text-sm text-muted">В этом городе пока нет кинотеатров в расписании.</p>
        )}
      </FormStep>
      <FormStep show={isCatalogId(cinema.id)}>
        {loading.films ? (
          <p className="text-sm text-muted">Загружаем фильмы…</p>
        ) : filmList.length ? (
          <CardRow label="Фильм" count={filmList.length}>
            {filmList.map((item) => {
              const meta = [
                item.ageRestriction != null ? `${item.ageRestriction}+` : "",
                item.duration ? `${item.duration} мин` : "",
              ].filter(Boolean);
              return (
                <PickCard
                  key={item.id}
                  selected={item.id === film.id}
                  title={item.name}
                  lines={meta}
                  imageUrl={item.posterUrl}
                  action={item.id === film.id ? "Выбран" : "Выбрать"}
                  onClick={() => {
                    setFilm({ id: item.id, name: item.name, custom: "" });
                    setSessionDateValue("");
                    setSessions([]);
                    setLoading((state) => ({ ...state, sessions: true }));
                  }}
                />
              );
            })}
          </CardRow>
        ) : (
          <p className="text-sm text-muted">В этом кинотеатре сейчас нет сеансов.</p>
        )}
      </FormStep>
      <FormStep show={isCatalogId(film.id)}>
        <Field id="group-session-date" label="Дата" required>
          <DatePicker
            id="group-session-date"
            value={sessionDateValue}
            min={todayIso()}
            markedDates={markedDates}
            disabled={loading.sessions}
            onChange={setSessionDateValue}
          />
        </Field>
      </FormStep>
      <FormStep show={isCatalogId(film.id) && Boolean(sessionDateValue)}>
        {loading.sessions ? (
          <p className="text-sm text-muted">Загружаем сеансы…</p>
        ) : sessionsOnDate.length ? (
          <CardRow label="Сеанс" count={sessionsOnDate.length}>
            {sessionsOnDate.map((item) => {
              const lines = [
                item.hallName,
                item.formatName && item.formatName !== item.hallName ? item.formatName : "",
                item.price ? `от ${item.price} ₽` : "",
              ].filter(Boolean);
              return (
                <PickCard
                  key={`${item.id}-${item.showtime}-${item.hallName}`}
                  title={sessionTime(item) || item.name}
                  lines={lines}
                  action="Купить билеты"
                  onClick={() => buySession(item)}
                />
              );
            })}
          </CardRow>
        ) : (
          <p className="text-sm text-muted">На эту дату сеансов нет — выберите другой день.</p>
        )}
      </FormStep>
      <GroupTerms label="Условия" />
    </div>
  );
}
