export type FormatItem = {
  id: string;
  name: string;
  benefits: string[];
  imageUrl: string | null;
  enabled: boolean;
  _count: { halls: number };
};

export type CinemaItem = {
  id: string;
  karoCinemaId: string;
  name: string;
  cityId: string;
  cityName: string;
  address: string | null;
  enabled: boolean;
  _count: { halls: number };
};

export type HallItem = {
  id: string;
  name: string;
  capacity: number;
  rentalPriceWeekday: number;
  rentalPriceWeekend: number;
  enabled: boolean;
  cinemaId: string;
  formatId: string;
  cinema: { id: string; name: string; cityName: string; enabled: boolean };
  format: { id: string; name: string; enabled: boolean };
};
