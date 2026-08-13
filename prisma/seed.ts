import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  const operatorEmail = (process.env.OPERATOR_EMAIL ?? "operator@karofilm.ru").toLowerCase();
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
