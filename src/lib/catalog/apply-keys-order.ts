import type { PrismaClient } from "@prisma/client";
import { KEYS_ORDER_CINEMAS } from "@/lib/catalog/keys-order";

function hallKey(name: string) {
  const digits = name.replace(/[^\d]/g, "");
  return digits || name.trim().toLowerCase();
}

export async function applyKeysOrderPrices(prisma: PrismaClient) {
  const formats = await prisma.hallFormat.findMany({ orderBy: { name: "asc" } });
  const fallbackFormat = formats.find((item) => item.name === "Стандарт") ?? formats[0];
  if (!fallbackFormat) return;

  for (const cinema of KEYS_ORDER_CINEMAS) {
    const record = await prisma.rentalCinema.upsert({
      where: { karoCinemaId: cinema.karoCinemaId },
      update: {
        name: cinema.name,
        cityId: cinema.cityId,
        cityName: cinema.cityName,
        enabled: true,
      },
      create: {
        karoCinemaId: cinema.karoCinemaId,
        name: cinema.name,
        cityId: cinema.cityId,
        cityName: cinema.cityName,
        enabled: true,
      },
    });

    const existingHalls = await prisma.hall.findMany({
      where: { cinemaId: record.id },
    });
    const byKey = new Map(existingHalls.map((hall) => [hallKey(hall.name), hall]));

    for (const hall of cinema.halls) {
      const key = hallKey(hall.hall);
      const name = /^\d+$/.test(hall.hall) ? `Зал ${hall.hall}` : hall.hall;
      const data = {
        rentalPriceWeekday: hall.weekday,
        rentalPriceWeekend: hall.weekend,
        priceOnRequest: hall.onRequest === true,
        consoleGaming: hall.consoleGaming === true,
      };
      const found = byKey.get(key);
      if (found) {
        await prisma.hall.update({ where: { id: found.id }, data });
        continue;
      }
      await prisma.hall.create({
        data: {
          cinemaId: record.id,
          formatId: fallbackFormat.id,
          name,
          capacity: 0,
          ...data,
        },
      });
    }
  }
}
