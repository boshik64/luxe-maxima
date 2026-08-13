import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/admin/auth";
import { listApplications } from "@/lib/applications/service";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const result = await listApplications({
    status: searchParams.get("status") ?? undefined,
    productId: searchParams.get("productId") ?? undefined,
    page: Number(searchParams.get("page") ?? 1),
    pageSize: Number(searchParams.get("pageSize") ?? 20) || 20,
  });
  return NextResponse.json(result);
}
