import { NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
  return NextResponse.json({ items });
}
