import { Prisma, Role } from "@prisma/client";
import { hashPassword } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

export class UserAdminError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

const publicUser = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: publicUser,
  });
}

export async function getUser(id: string) {
  return prisma.user.findUnique({ where: { id }, select: publicUser });
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role: Role;
}) {
  const email = data.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new UserAdminError("Укажите корректный email");
  }
  if (data.password.length < 8) {
    throw new UserAdminError("Пароль не короче 8 символов");
  }
  const name = data.name.trim();
  if (!name) throw new UserAdminError("Укажите имя");

  try {
    return await prisma.user.create({
      data: {
        email,
        name,
        role: data.role,
        passwordHash: await hashPassword(data.password),
      },
      select: publicUser,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new UserAdminError("Пользователь с таким email уже есть", 409);
    }
    throw error;
  }
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    name?: string;
    password?: string;
    role?: Role;
  },
) {
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) throw new UserAdminError("Не найдено", 404);

  if (data.role && data.role !== current.role && current.role === Role.ADMIN) {
    await assertNotLastAdmin(id);
  }

  if (data.password && data.password.length < 8) {
    throw new UserAdminError("Пароль не короче 8 символов");
  }

  const email = data.email?.trim().toLowerCase();
  const name = data.name?.trim();

  try {
    return await prisma.user.update({
      where: { id },
      data: {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
      },
      select: publicUser,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new UserAdminError("Пользователь с таким email уже есть", 409);
    }
    throw error;
  }
}

export async function deleteUser(id: string, actorId: string) {
  if (id === actorId) {
    throw new UserAdminError("Нельзя удалить собственную учётную запись");
  }
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) throw new UserAdminError("Не найдено", 404);
  if (current.role === Role.ADMIN) {
    await assertNotLastAdmin(id);
  }
  await prisma.user.delete({ where: { id } });
}

async function assertNotLastAdmin(id: string) {
  const admins = await prisma.user.count({ where: { role: Role.ADMIN } });
  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === Role.ADMIN && admins <= 1) {
    throw new UserAdminError("Нельзя убрать последнего администратора");
  }
}
