import { prisma } from "@/lib/db";

export class CatalogError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function isPublished(value: boolean | null | undefined) {
  return value !== false;
}

export async function listPublicCinemas(cityId: string) {
  return prisma.rentalCinema.findMany({
    where: { cityId, enabled: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true, karoCinemaId: true },
  });
}

export async function listPublicFormats(cinemaId: string) {
  const halls = await prisma.hall.findMany({
    where: { cinemaId },
    include: { format: true, cinema: true },
    orderBy: { format: { name: "asc" } },
  });

  const seen = new Set<string>();
  return halls
    .filter(
      (hall) =>
        isPublished(hall.enabled) &&
        isPublished(hall.cinema.enabled) &&
        isPublished(hall.format.enabled),
    )
    .map((hall) => hall.format)
    .filter((format) => {
      if (seen.has(format.id)) return false;
      seen.add(format.id);
      return true;
    })
    .map((format) => ({
      id: format.id,
      name: format.name,
      benefits: format.benefits,
      imageUrl: format.imageUrl,
    }));
}

export async function listPublicHalls(cinemaId: string, formatId: string) {
  const halls = await prisma.hall.findMany({
    where: { cinemaId, formatId },
    include: { cinema: true, format: true },
    orderBy: { name: "asc" },
  });

  return halls
    .filter(
      (hall) =>
        isPublished(hall.enabled) &&
        isPublished(hall.cinema.enabled) &&
        isPublished(hall.format.enabled),
    )
    .map((hall) => ({
      id: hall.id,
      name: hall.name,
      capacity: hall.capacity,
      rentalPriceWeekday: hall.rentalPriceWeekday,
      rentalPriceWeekend: hall.rentalPriceWeekend,
      formatName: hall.format.name,
      cinemaName: hall.cinema.name,
    }));
}

export async function getEnabledHall(id: string) {
  const hall = await prisma.hall.findUnique({
    where: { id },
    include: { cinema: true, format: true },
  });
  if (
    !hall ||
    !isPublished(hall.enabled) ||
    !isPublished(hall.cinema.enabled) ||
    !isPublished(hall.format.enabled)
  ) {
    return null;
  }
  return hall;
}

export async function listFormats() {
  return prisma.hallFormat.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { halls: true } } },
  });
}

export async function getFormat(id: string) {
  return prisma.hallFormat.findUnique({
    where: { id },
    include: { _count: { select: { halls: true } } },
  });
}

export async function createFormat(data: {
  name: string;
  benefits: string[];
  imageUrl?: string | null;
}) {
  return prisma.hallFormat.create({
    data: {
      name: data.name.trim(),
      benefits: data.benefits,
      imageUrl: data.imageUrl?.trim() || null,
    },
  });
}

export async function updateFormat(
  id: string,
  data: {
    name?: string;
    benefits?: string[];
    imageUrl?: string | null;
    enabled?: boolean;
  },
) {
  return prisma.hallFormat.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.benefits !== undefined ? { benefits: data.benefits } : {}),
      ...(data.imageUrl !== undefined
        ? { imageUrl: data.imageUrl?.trim() || null }
        : {}),
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
    },
    include: { _count: { select: { halls: true } } },
  });
}

export async function deleteFormat(id: string) {
  const halls = await prisma.hall.count({ where: { formatId: id } });
  if (halls > 0) {
    throw new CatalogError("Нельзя удалить формат, пока к нему привязаны залы");
  }
  return prisma.hallFormat.delete({ where: { id } });
}

export async function listCinemas() {
  return prisma.rentalCinema.findMany({
    orderBy: [{ cityName: "asc" }, { name: "asc" }],
    include: { _count: { select: { halls: true } } },
  });
}

export async function getCinema(id: string) {
  return prisma.rentalCinema.findUnique({
    where: { id },
    include: { _count: { select: { halls: true } } },
  });
}

export async function createCinema(data: {
  karoCinemaId: string;
  name: string;
  cityId: string;
  cityName: string;
  address?: string | null;
  enabled?: boolean;
}) {
  return prisma.rentalCinema.create({
    data: {
      karoCinemaId: data.karoCinemaId.trim(),
      name: data.name.trim(),
      cityId: data.cityId.trim(),
      cityName: data.cityName.trim(),
      address: data.address?.trim() || null,
      enabled: data.enabled ?? true,
    },
  });
}

export async function updateCinema(
  id: string,
  data: {
    name?: string;
    cityId?: string;
    cityName?: string;
    address?: string | null;
    enabled?: boolean;
  },
) {
  return prisma.rentalCinema.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.cityId !== undefined ? { cityId: data.cityId.trim() } : {}),
      ...(data.cityName !== undefined ? { cityName: data.cityName.trim() } : {}),
      ...(data.address !== undefined
        ? { address: data.address?.trim() || null }
        : {}),
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
    },
  });
}

export async function deleteCinema(id: string) {
  return prisma.rentalCinema.delete({ where: { id } });
}

export async function listHalls() {
  return prisma.hall.findMany({
    orderBy: [{ cinema: { name: "asc" } }, { name: "asc" }],
    include: { cinema: true, format: true },
  });
}

export async function getHall(id: string) {
  return prisma.hall.findUnique({
    where: { id },
    include: { cinema: true, format: true },
  });
}

export async function createHall(data: {
  cinemaId: string;
  formatId: string;
  name: string;
  capacity: number;
  rentalPriceWeekday: number;
  rentalPriceWeekend: number;
}) {
  return prisma.hall.create({
    data: {
      cinemaId: data.cinemaId,
      formatId: data.formatId,
      name: data.name.trim(),
      capacity: data.capacity,
      rentalPriceWeekday: data.rentalPriceWeekday,
      rentalPriceWeekend: data.rentalPriceWeekend,
    },
  });
}

export async function updateHall(
  id: string,
  data: {
    cinemaId?: string;
    formatId?: string;
    name?: string;
    capacity?: number;
    rentalPriceWeekday?: number;
    rentalPriceWeekend?: number;
    enabled?: boolean;
  },
) {
  return prisma.hall.update({
    where: { id },
    data: {
      ...(data.cinemaId !== undefined ? { cinemaId: data.cinemaId } : {}),
      ...(data.formatId !== undefined ? { formatId: data.formatId } : {}),
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      ...(data.rentalPriceWeekday !== undefined
        ? { rentalPriceWeekday: data.rentalPriceWeekday }
        : {}),
      ...(data.rentalPriceWeekend !== undefined
        ? { rentalPriceWeekend: data.rentalPriceWeekend }
        : {}),
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
    },
  });
}

export async function deleteHall(id: string) {
  return prisma.hall.delete({ where: { id } });
}
