"use client";

import { useEffect, useState } from "react";
import {
  CascadeSelect,
  type CascadeValue,
} from "@/components/form/CascadeSelect";
import { formatRubles } from "@/lib/catalog/format";
import { CUSTOM_OPTION, type ScheduleOption } from "@/lib/karo/types";

const empty: CascadeValue = { id: "", name: "", custom: "" };

type FormatOption = ScheduleOption & {
  benefits: string[];
  imageUrl?: string | null;
};

type HallOption = ScheduleOption & {
  capacity: number;
  rentalPrice: number;
};

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("catalog");
  return response.json() as Promise<T>;
}

function isCatalogId(id: string) {
  return Boolean(id) && id !== CUSTOM_OPTION.id;
}

export function RentalHallFields({
  errors,
  onChange,
}: {
  errors: Record<string, string>;
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
  const [cities, setCities] = useState<ScheduleOption[]>([]);
  const [cinemas, setCinemas] = useState<ScheduleOption[]>([]);
  const [formats, setFormats] = useState<FormatOption[]>([]);
  const [halls, setHalls] = useState<HallOption[]>([]);
  const [loading, setLoading] = useState({
    cities: true,
    cinemas: false,
    formats: false,
    halls: false,
  });
  const [catalogError, setCatalogError] = useState("");

  const selectedFormat = formats.find((item) => item.id === hallFormat.id);
  const selectedHall = halls.find((item) => item.id === hall.id);

  useEffect(() => {
    let cancelled = false;
    loadJson<{ items: ScheduleOption[] }>("/api/schedule/cities")
      .then((data) => {
        if (!cancelled) setCities(data.items);
      })
      .catch(() => {
        if (!cancelled) {
          setCities([CUSTOM_OPTION]);
          setCatalogError(
            "Не удалось загрузить города. Можно указать город вручную.",
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
    loadJson<{ items: ScheduleOption[] }>(`/api/catalog/cinemas?cityId=${city.id}`)
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
    loadJson<{ items: HallOption[] }>(
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
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Город: «свой вариант» оставляем; кинотеатр и зал — только из справочника. */}
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
            setHallFormat(empty);
            setHall(empty);
            setCinemas([]);
            setFormats([]);
            setHalls([]);
            setLoading((state) => ({
              ...state,
              cinemas: isCatalogId(value.id),
              formats: false,
              halls: false,
            }));
            emit({
              city: value,
              cinema: empty,
              hallFormat: empty,
              hall: empty,
            });
          }}
        />
        <CascadeSelect
          id="cinema"
          label="Кинотеатр"
          required
          allowCustom={false}
          value={cinema}
          options={cinemas}
          loading={loading.cinemas}
          disabled={!isCatalogId(city.id)}
          errorId={errors["cinema.id"]}
          onChange={(value) => {
            setCinema(value);
            setHallFormat(empty);
            setHall(empty);
            setFormats([]);
            setHalls([]);
            setLoading((state) => ({
              ...state,
              formats: isCatalogId(value.id),
              halls: false,
            }));
            emit({
              city,
              cinema: value,
              hallFormat: empty,
              hall: empty,
            });
          }}
        />
        <div>
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
          <div className="mt-3 min-h-[7.5rem] rounded-2xl border border-line bg-background/60 px-4 py-3">
            {selectedFormat ? (
              selectedFormat.benefits.length ? (
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
              )
            ) : (
              <p className="text-sm text-muted">
                После выбора формата здесь появятся его преимущества.
              </p>
            )}
          </div>
        </div>
        <div>
          <CascadeSelect
            id="hall"
            label="Зал"
            required
            allowCustom={false}
            value={hall}
            options={halls}
            loading={loading.halls}
            disabled={!hallFormat.id}
            errorId={errors["hall.id"]}
            onChange={(value) => {
              setHall(value);
              emit({ city, cinema, hallFormat, hall: value });
            }}
          />
          <div className="mt-3 min-h-[4.5rem] rounded-2xl border border-line bg-background/60 px-4 py-3 text-sm">
            {selectedHall ? (
              <p>
                Вместимость: {selectedHall.capacity} мест
                <br />
                Стоимость аренды: {formatRubles(selectedHall.rentalPrice)}
              </p>
            ) : (
              <p className="text-muted">
                После выбора зала здесь появятся вместимость и стоимость.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
