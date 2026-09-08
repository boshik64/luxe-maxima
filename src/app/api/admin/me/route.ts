import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import {
  getUser,
  notifyPrefsFromBody,
  updateOwnNotifyPrefs,
} from "@/lib/admin/users";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireSession();
    const [feedbackNewCount, user] = await Promise.all([
      prisma.feedback.count({ where: { status: "NEW" } }),
      getUser(session.sub),
    ]);
    return NextResponse.json({
      id: session.sub,
      email: session.email,
      name: session.name,
      role: session.role,
      feedbackNewCount,
      notifyKeys: user?.notifyKeys ?? false,
      notifyEvent: user?.notifyEvent ?? false,
      notifyFeedback: user?.notifyFeedback ?? false,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as Record<string, unknown>;
    const prefs = notifyPrefsFromBody(body);
    const item = await updateOwnNotifyPrefs(session.sub, prefs);
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
