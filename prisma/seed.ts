import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FORMAT_STUBS = [
  {
    name: "Стандарт",
    benefits: [
      "Классический зал для частных сеансов",
      "Подходит для компаний и классов",
    ],
  },
  {
    name: "Комфорт+",
    benefits: [
      "Кресла повышенной комфортности",
      "Удобен для камерных мероприятий",
    ],
  },
  {
    name: "Премиум",
    benefits: ["Меньше мест и больше пространства", "Для закрытых показов"],
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
        update: { benefits: format.benefits },
        create: format,
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
      rentalPrice: 80000,
    },
    {
      cinema: cinemas[0],
      format: byName["IMAX"],
      name: "IMAX",
      capacity: 350,
      rentalPrice: 250000,
    },
    {
      cinema: cinemas[1],
      format: byName["Комфорт+"],
      name: "Зал Комфорт+",
      capacity: 80,
      rentalPrice: 120000,
    },
    {
      cinema: cinemas[1],
      format: byName["Премиум"],
      name: "Зал Премиум",
      capacity: 40,
      rentalPrice: 150000,
    },
    {
      cinema: cinemas[2],
      format: byName["4DX"],
      name: "4DX",
      capacity: 96,
      rentalPrice: 180000,
    },
    {
      cinema: cinemas[2],
      format: byName["Стандарт"],
      name: "Зал 3",
      capacity: 200,
      rentalPrice: 90000,
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
          rentalPrice: hall.rentalPrice,
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
        rentalPrice: hall.rentalPrice,
      },
    });
  }
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
