"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { type CascadeValue } from "@/components/form/CascadeSelect";
import { FormStep } from "@/components/form/Field";
import { HallCards, type HallCardItem } from "@/components/form/HallCards";
import { CardRow, PickCard } from "@/components/form/PickCards";
import { HALL_HOLIDAY_PRICE_NOTE } from "@/lib/catalog/format";
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
  const [hall, setHall] = useState(empty);
  const [cities, setCities] = useState<CityCardOption[]>([]);
  const [cinemas, setCinemas] = useState<CinemaOption[]>([]);
  const [halls, setHalls] = useState<HallCardItem[]>([]);
  const [loading, setLoading] = useState({
    cities: true,
    cinemas: false,
    halls: false,
  });
  const [catalogError, setCatalogError] = useState("");

  const cinemaList = useMemo(() => catalogOnly(cinemas), [cinemas]);
  const cinemaReady = cascadeReady(cinema);

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
    loadJson<{ items: HallCardItem[] }>(
      `/api/catalog/halls?cinemaId=${cinema.id}`,
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
  }, [cinema.id]);

  function emit(next: {
    city: CascadeValue;
    cinema: CascadeValue;
    hall: CascadeValue;
  }) {
    // Формат зала берётся с сервера из выбранного зала — отдельный шаг не нужен.
    onChange({
      city: next.city,
      cinema: next.cinema,
      hallFormat: empty,
      hall: next.hall,
    });
  }

  return (
    <div className="space-y-5">
      {catalogError ? (
        <p className="text-sm text-gold" role="status">
          {catalogError}
        </p>
      ) : null}
      <FormStep show scrollOnShow={false} id="form-city">
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
                  setHall(empty);
                  setCinemas([]);
                  setHalls([]);
                  setLoading((state) => ({
                    ...state,
                    cinemas: true,
                    halls: false,
                  }));
                  emit({
                    city: next,
                    cinema: empty,
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
                  setHall(empty);
                  setHalls([]);
                  setLoading((state) => ({
                    ...state,
                    halls: true,
                  }));
                  emit({
                    city,
                    cinema: next,
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
      <FormStep show={cinemaReady}>{guests}</FormStep>
      <FormStep show={cinemaReady && guestsFilled}>
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
            emit({ city, cinema, hall: next });
          }}
        />
        <p className="text-xs text-muted">{HALL_HOLIDAY_PRICE_NOTE}</p>
      </FormStep>
    </div>
  );
}
