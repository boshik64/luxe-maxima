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

export type NotifyPrefs = {
  notifyKeys: boolean;
  notifyEvent: boolean;
  notifyFeedback: boolean;
};

export type StaffNotifyKind = "keys" | "event" | "feedback";

const publicUser = {
  id: true,
  email: true,
  name: true,
  role: true,
  notifyKeys: true,
  notifyEvent: true,
  notifyFeedback: true,
  createdAt: true,
  updatedAt: true,
} as const;

function parseNotifyFlag(value: unknown, fallback?: boolean) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export function notifyPrefsFromBody(
  body: Record<string, unknown>,
  fallback?: Partial<NotifyPrefs>,
): NotifyPrefs {
  return {
    notifyKeys: parseNotifyFlag(body.notifyKeys, fallback?.notifyKeys) ?? false,
    notifyEvent: parseNotifyFlag(body.notifyEvent, fallback?.notifyEvent) ?? false,
    notifyFeedback:
      parseNotifyFlag(body.notifyFeedback, fallback?.notifyFeedback) ?? false,
  };
}

export function notifyPrefsPatchFromBody(body: Record<string, unknown>) {
  const patch: Partial<NotifyPrefs> = {};
  if ("notifyKeys" in body) {
    patch.notifyKeys = parseNotifyFlag(body.notifyKeys) ?? false;
  }
  if ("notifyEvent" in body) {
    patch.notifyEvent = parseNotifyFlag(body.notifyEvent) ?? false;
  }
  if ("notifyFeedback" in body) {
    patch.notifyFeedback = parseNotifyFlag(body.notifyFeedback) ?? false;
  }
  return patch;
}

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
  notifyKeys?: boolean;
  notifyEvent?: boolean;
  notifyFeedback?: boolean;
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
        notifyKeys: data.notifyKeys === true,
        notifyEvent: data.notifyEvent === true,
        notifyFeedback: data.notifyFeedback === true,
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
    notifyKeys?: boolean;
    notifyEvent?: boolean;
    notifyFeedback?: boolean;
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
        ...(data.notifyKeys !== undefined ? { notifyKeys: data.notifyKeys } : {}),
        ...(data.notifyEvent !== undefined ? { notifyEvent: data.notifyEvent } : {}),
        ...(data.notifyFeedback !== undefined
          ? { notifyFeedback: data.notifyFeedback }
          : {}),
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

export async function updateOwnNotifyPrefs(id: string, prefs: NotifyPrefs) {
  return prisma.user.update({
    where: { id },
    data: prefs,
    select: publicUser,
  });
}

/** Emails of staff who opted into this notification type. */
export async function listStaffNotifyEmails(kind: StaffNotifyKind) {
  const where =
    kind === "keys"
      ? { notifyKeys: true }
      : kind === "event"
        ? { notifyEvent: true }
        : { notifyFeedback: true };

  const users = await prisma.user.findMany({
    where,
    select: { email: true },
  });
  return [...new Set(users.map((user) => user.email.trim().toLowerCase()).filter(Boolean))];
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
