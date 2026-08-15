import { NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();
    const feedbackNewCount = await prisma.feedback.count({
      where: { status: "NEW" },
    });
    return NextResponse.json({
      id: session.sub,
      email: session.email,
      name: session.name,
      role: session.role,
      feedbackNewCount,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
