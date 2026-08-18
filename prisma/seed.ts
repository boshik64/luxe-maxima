import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CAROUSEL_EVENT_SLIDES } from "../src/lib/carousel/defaults";

const prisma = new PrismaClient();

const FORMAT_STUBS = [
  {
    name: "Стандарт",
    benefits: [
      "Классический зал для частных сеансов",
      "Подходит для компаний и классов",
    ],
    imageUrl: "/halls/standart.png",
    showcasePublished: true,
    showcaseOrder: 1,
  },
  {
    name: "Комфорт+",
    benefits: [
      "Кресла повышенной комфортности",
      "Удобен для камерных мероприятий",
    ],
    imageUrl: "/halls/comfort.png",
    showcasePublished: true,
    showcaseOrder: 2,
  },
  {
    name: "Премиум",
    benefits: ["Меньше мест и больше пространства", "Для закрытых показов"],
    imageUrl: "/halls/black.png",
    showcasePublished: true,
    showcaseOrder: 3,
  },
  {
    name: "IMAX",
    benefits: ["Большой экран и усиленный звук", "Эффект полного погружения"],
  },
  {
    name: "4DX",
    benefits: ["Движение кресел и спецэффекты", "Для зрелищного контента"],
  },
];

const CINEMA_STUBS = [
  { karoCinemaId: "3", name: "7 Атриум", cityId: "1", cityName: "Москва" },
  { karoCinemaId: "10", name: "11 Октябрь", cityId: "1", cityName: "Москва" },
  {
    karoCinemaId: "35",
    name: "Sky 17 Авиапарк",
    cityId: "1",
    cityName: "Москва",
  },
];

async function seedCatalog() {
  const formats = [];
  for (const format of FORMAT_STUBS) {
    formats.push(
      await prisma.hallFormat.upsert({
        where: { name: format.name },
        update: {
          benefits: format.benefits,
          ...("imageUrl" in format
            ? {
                imageUrl: format.imageUrl,
                showcasePublished: format.showcasePublished === true,
                showcaseOrder: format.showcaseOrder ?? 0,
              }
            : {}),
        },
        create: {
          name: format.name,
          benefits: format.benefits,
          imageUrl: "imageUrl" in format ? format.imageUrl : undefined,
          showcasePublished:
            "showcasePublished" in format ? format.showcasePublished === true : false,
          showcaseOrder: "showcaseOrder" in format ? format.showcaseOrder ?? 0 : 0,
        },
      }),
    );
  }

  const byName = Object.fromEntries(formats.map((item) => [item.name, item]));
  const cinemas = [];
  for (const cinema of CINEMA_STUBS) {
    cinemas.push(
      await prisma.rentalCinema.upsert({
        where: { karoCinemaId: cinema.karoCinemaId },
        update: {
          name: cinema.name,
          cityId: cinema.cityId,
          cityName: cinema.cityName,
          enabled: true,
        },
        create: cinema,
      }),
    );
  }

  const hallStubs = [
    {
      cinema: cinemas[0],
      format: byName["Стандарт"],
      name: "Зал 1",
      capacity: 120,
      rentalPriceWeekday: 80000,
      rentalPriceWeekend: 95000,
    },
    {
      cinema: cinemas[0],
      format: byName["IMAX"],
      name: "IMAX",
      capacity: 350,
      rentalPriceWeekday: 250000,
      rentalPriceWeekend: 290000,
    },
    {
      cinema: cinemas[1],
      format: byName["Комфорт+"],
      name: "Зал Комфорт+",
      capacity: 80,
      rentalPriceWeekday: 120000,
      rentalPriceWeekend: 140000,
    },
    {
      cinema: cinemas[1],
      format: byName["Премиум"],
      name: "Зал Премиум",
      capacity: 40,
      rentalPriceWeekday: 150000,
      rentalPriceWeekend: 175000,
    },
    {
      cinema: cinemas[2],
      format: byName["4DX"],
      name: "4DX",
      capacity: 96,
      rentalPriceWeekday: 180000,
      rentalPriceWeekend: 210000,
    },
    {
      cinema: cinemas[2],
      format: byName["Стандарт"],
      name: "Зал 3",
      capacity: 200,
      rentalPriceWeekday: 90000,
      rentalPriceWeekend: 110000,
    },
  ];

  for (const hall of hallStubs) {
    const existing = await prisma.hall.findFirst({
      where: { cinemaId: hall.cinema.id, name: hall.name },
    });
    if (existing) {
      await prisma.hall.update({
        where: { id: existing.id },
        data: {
          formatId: hall.format.id,
          capacity: hall.capacity,
          rentalPriceWeekday: hall.rentalPriceWeekday,
          rentalPriceWeekend: hall.rentalPriceWeekend,
        },
      });
      continue;
    }
    await prisma.hall.create({
      data: {
        cinemaId: hall.cinema.id,
        formatId: hall.format.id,
        name: hall.name,
        capacity: hall.capacity,
        rentalPriceWeekday: hall.rentalPriceWeekday,
        rentalPriceWeekend: hall.rentalPriceWeekend,
      },
    });
  }
}

async function seedCarousel() {
  await prisma.carouselSlide.deleteMany();
  await prisma.carouselSlide.createMany({ data: CAROUSEL_EVENT_SLIDES });
  await prisma.carouselSettings.upsert({
    where: { id: "default" },
    create: { id: "default", intervalSeconds: 6 },
    update: {},
  });
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@karofilm.ru").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "changeme";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN, name: "Администратор" },
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
      name: "Администратор",
    },
  });

  const operatorEmail = (
    process.env.OPERATOR_EMAIL ?? "operator@karofilm.ru"
  ).toLowerCase();
  const operatorHash = await bcrypt.hash(
    process.env.OPERATOR_PASSWORD ?? "changeme",
    12,
  );
  await prisma.user.upsert({
    where: { email: operatorEmail },
    update: { passwordHash: operatorHash, role: Role.OPERATOR, name: "Оператор" },
    create: {
      email: operatorEmail,
      passwordHash: operatorHash,
      role: Role.OPERATOR,
      name: "Оператор",
    },
  });

  await seedCatalog();
  await seedCarousel();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
