"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CascadeSelect,
  type CascadeValue,
} from "@/components/form/CascadeSelect";
import { FormStep } from "@/components/form/Field";
import { HallCards, type HallCardItem } from "@/components/form/HallCards";
import { CardRow, PickCard } from "@/components/form/PickCards";
import { formatCinemaCount } from "@/lib/karo/cities";
import {
  CUSTOM_OPTION_ID,
  type CinemaOption,
  type ScheduleOption,
} from "@/lib/karo/types";

const empty: CascadeValue = { id: "", name: "", custom: "" };

type CityCardOption = ScheduleOption & {
  cinemaCount?: number;
  crestUrl?: string;
};

type FormatOption = ScheduleOption & {
  benefits: string[];
  imageUrl?: string | null;
};

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("catalog");
  return response.json() as Promise<T>;
}

function isCatalogId(id: string) {
  return Boolean(id) && id !== CUSTOM_OPTION_ID;
}

function catalogOnly<T extends { id: string }>(items: T[]) {
  return items.filter((item) => item.id !== CUSTOM_OPTION_ID);
}

function cascadeReady(value: CascadeValue) {
  if (value.id === CUSTOM_OPTION_ID) return Boolean(value.custom.trim());
  return Boolean(value.id);
}

export function RentalHallFields({
  errors,
  guests,
  guestsFilled,
  onChange,
}: {
  errors: Record<string, string>;
  guests: ReactNode;
  guestsFilled: boolean;
  onChange: (value: {
    city: CascadeValue;
    cinema: CascadeValue;
    hallFormat: CascadeValue;
    hall: CascadeValue;
  }) => void;
}) {
  const [city, setCity] = useState(empty);
  const [cinema, setCinema] = useState(empty);
  const [hallFormat, setHallFormat] = useState(empty);
  const [hall, setHall] = useState(empty);
  const [cities, setCities] = useState<CityCardOption[]>([]);
  const [cinemas, setCinemas] = useState<CinemaOption[]>([]);
  const [formats, setFormats] = useState<FormatOption[]>([]);
  const [halls, setHalls] = useState<HallCardItem[]>([]);
  const [loading, setLoading] = useState({
    cities: true,
    cinemas: false,
    formats: false,
    halls: false,
  });
  const [catalogError, setCatalogError] = useState("");

  const cinemaList = useMemo(() => catalogOnly(cinemas), [cinemas]);
  const selectedFormat = formats.find((item) => item.id === hallFormat.id);
  const cinemaReady = cascadeReady(cinema);
  const formatReady = cascadeReady(hallFormat);

  useEffect(() => {
    let cancelled = false;
    loadJson<{ items: CityCardOption[] }>("/api/schedule/cities")
      .then((data) => {
        if (!cancelled) setCities(catalogOnly(data.items));
      })
      .catch(() => {
        if (!cancelled) {
          setCities([]);
          setCatalogError("Не удалось загрузить города. Попробуйте позже.");
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
    loadJson<{ items: CinemaOption[] }>(`/api/catalog/cinemas?cityId=${city.id}`)
      .then((data) => {
        if (!cancelled) {
          setCinemas(data.items);
          setCatalogError(
            data.items.length
              ? ""
              : "В этом городе пока нет кинотеатров для аренды.",
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCinemas([]);
          setCatalogError("Не удалось загрузить кинотеатры для аренды.");
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
    loadJson<{ items: FormatOption[] }>(`/api/catalog/formats?cinemaId=${cinema.id}`)
      .then((data) => {
        if (!cancelled) setFormats(data.items);
      })
      .catch(() => {
        if (!cancelled) setFormats([]);
      })
      .finally(() => {
        if (!cancelled) setLoading((state) => ({ ...state, formats: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [cinema.id]);

  useEffect(() => {
    if (!isCatalogId(cinema.id) || !isCatalogId(hallFormat.id)) return;
    let cancelled = false;
    loadJson<{ items: HallCardItem[] }>(
      `/api/catalog/halls?cinemaId=${cinema.id}&formatId=${hallFormat.id}`,
    )
      .then((data) => {
        if (!cancelled) setHalls(data.items);
      })
      .catch(() => {
        if (!cancelled) setHalls([]);
      })
      .finally(() => {
        if (!cancelled) setLoading((state) => ({ ...state, halls: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [cinema.id, hallFormat.id]);

  function emit(next: {
    city: CascadeValue;
    cinema: CascadeValue;
    hallFormat: CascadeValue;
    hall: CascadeValue;
  }) {
    onChange(next);
  }

  return (
    <div className="space-y-5">
      {catalogError ? (
        <p className="text-sm text-gold" role="status">
          {catalogError}
        </p>
      ) : null}
      <FormStep show>
        {loading.cities ? (
          <p className="text-sm text-muted">Загружаем города…</p>
        ) : cities.length ? (
          <CardRow label="Город" count={cities.length} error={errors["city.id"]}>
            {cities.map((item) => (
              <PickCard
                key={item.id}
                selected={item.id === city.id}
                title={item.name}
                crestUrl={item.crestUrl}
                lines={[formatCinemaCount(item.cinemaCount ?? 0)]}
                action={item.id === city.id ? "Выбран" : "Выбрать"}
                onClick={() => {
                  const next = { id: item.id, name: item.name, custom: "" };
                  setCity(next);
                  setCinema(empty);
                  setHallFormat(empty);
                  setHall(empty);
                  setCinemas([]);
                  setFormats([]);
                  setHalls([]);
                  setLoading((state) => ({
                    ...state,
                    cinemas: true,
                    formats: false,
                    halls: false,
                  }));
                  emit({
                    city: next,
                    cinema: empty,
                    hallFormat: empty,
                    hall: empty,
                  });
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
          <CardRow
            label="Кинотеатр"
            count={cinemaList.length}
            error={errors["cinema.id"]}
          >
            {cinemaList.map((item) => (
              <PickCard
                key={item.id}
                selected={item.id === cinema.id}
                title={item.name}
                lines={item.address ? [item.address] : []}
                action={item.id === cinema.id ? "Выбран" : "Выбрать"}
                onClick={() => {
                  const next = { id: item.id, name: item.name, custom: "" };
                  setCinema(next);
                  setHallFormat(empty);
                  setHall(empty);
                  setFormats([]);
                  setHalls([]);
                  setLoading((state) => ({
                    ...state,
                    formats: true,
                    halls: false,
                  }));
                  emit({
                    city,
                    cinema: next,
                    hallFormat: empty,
                    hall: empty,
                  });
                }}
              />
            ))}
          </CardRow>
        ) : (
          <p className="text-sm text-muted">
            В этом городе пока нет кинотеатров для аренды.
          </p>
        )}
      </FormStep>
      <FormStep show={cinemaReady}>
        <div className="space-y-5">
          <CascadeSelect
            id="hallFormat"
            label="Формат зала"
            required
            allowCustom={false}
            value={hallFormat}
            options={formats}
            loading={loading.formats}
            disabled={!cinema.id}
            errorId={errors["hallFormat.id"]}
            onChange={(value) => {
              setHallFormat(value);
              setHall(empty);
              setHalls([]);
              setLoading((state) => ({
                ...state,
                halls: isCatalogId(value.id),
              }));
              emit({ city, cinema, hallFormat: value, hall: empty });
            }}
          />
          {formatReady ? (
            <div className="rounded-2xl border border-line bg-background/60 px-4 py-3">
              {selectedFormat?.benefits.length ? (
                <ul className="space-y-1 text-sm text-muted">
                  {selectedFormat.benefits.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  Для этого формата пока нет описания преимуществ.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </FormStep>
      <FormStep show={formatReady}>{guests}</FormStep>
      <FormStep show={formatReady && guestsFilled}>
        <HallCards
          halls={halls}
          selectedId={hall.id}
          loading={loading.halls}
          error={errors["hall.id"]}
          onSelect={(item) => {
            const next = item
              ? { id: item.id, name: item.name, custom: "" }
              : empty;
            setHall(next);
            emit({ city, cinema, hallFormat, hall: next });
          }}
        />
      </FormStep>
    </div>
  );
}
