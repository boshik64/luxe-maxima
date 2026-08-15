import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import { requireRole, requireSession } from "@/lib/admin/auth";
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from "@/lib/applications/service";

const STATUSES = Object.values(ApplicationStatus);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const item = await getApplication(id);
  if (!item) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  if (body.status && !STATUSES.includes(body.status as ApplicationStatus)) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }

  const existing = await getApplication(id);
  if (!existing) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const updated = await updateApplication(id, {
    status: body.status as ApplicationStatus | undefined,
    contactName: typeof body.contactName === "string" ? body.contactName : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
    email: typeof body.email === "string" ? body.email : undefined,
    comment: typeof body.comment === "string" ? body.comment : undefined,
    guests: typeof body.guests === "number" ? body.guests : undefined,
    cityName: typeof body.cityName === "string" ? body.cityName : undefined,
    cinemaName: typeof body.cinemaName === "string" ? body.cinemaName : undefined,
    hallName: typeof body.hallName === "string" ? body.hallName : undefined,
    hallFormatName:
      typeof body.hallFormatName === "string" ? body.hallFormatName : undefined,
    filmName: typeof body.filmName === "string" ? body.filmName : undefined,
    sessionLabel: typeof body.sessionLabel === "string" ? body.sessionLabel : undefined,
    sessionCustom: typeof body.sessionCustom === "string" ? body.sessionCustom : undefined,
    rentalDate: typeof body.rentalDate === "string" ? body.rentalDate : undefined,
    rentalTime: typeof body.rentalTime === "string" ? body.rentalTime : undefined,
    rentalStart: typeof body.rentalStart === "string" ? body.rentalStart : undefined,
    rentalEnd: typeof body.rentalEnd === "string" ? body.rentalEnd : undefined,
    ticketType: typeof body.ticketType === "string" ? body.ticketType : undefined,
    adminComment: typeof body.adminComment === "string" ? body.adminComment : undefined,
    watchCustom: typeof body.watchCustom === "string" ? body.watchCustom : undefined,
  });
  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["ADMIN"]);
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const { id } = await context.params;
  await deleteApplication(id);
  return NextResponse.json({ ok: true });
}
