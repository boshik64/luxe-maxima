export type KaroCity = {
  id: number;
  name: string;
  is_default?: number;
  ordering?: number;
};

export type KaroCinema = {
  id: number;
  city_id: number;
  name: string;
  address: string;
  formats?: string[];
  advantages?: number[];
  media?: {
    cover?: string;
    bg?: { desktop?: string; tablet?: string; mobile?: string };
  };
};

export type KaroAttribute = {
  id: number;
  name: string;
  type: string;
  show_in_filter?: boolean;
};

export type KaroMovie = {
  id: number;
  name: string;
};

export type KaroFlatSession = {
  id: number;
  cinema_id: number;
  film_id: number;
  format_id: number;
  date: string;
  time: string;
  showtime: string;
  standard_price: number;
  attribute_ids: number[];
  attribute_types: string[];
};

export type KaroNestedSession = {
  id: number;
  date: string;
  time: string;
  showtime: string;
  standard_price: number;
  attributes: number[];
  attribute_types: string[];
};

export type KaroNestedFilm = {
  id: number;
  name: string;
  formats: Array<{
    id: number;
    format_name: string;
    sessions: KaroNestedSession[];
  }>;
};

export type ScheduleOption = {
  id: string;
  name: string;
};

export type SessionOption = ScheduleOption & {
  showtime: string;
  filmName: string;
  hallName: string;
};

export const CUSTOM_OPTION_ID = "__custom__";
export const CUSTOM_OPTION: ScheduleOption = {
  id: CUSTOM_OPTION_ID,
  name: "Свой вариант",
};
export const CUSTOM_SESSION_OPTION: ScheduleOption = {
  id: CUSTOM_OPTION_ID,
  name: "Не нашел подходящий сеанс / свое время",
};

export const HALL_ATTRIBUTE_TYPES = new Set(["format"]);
