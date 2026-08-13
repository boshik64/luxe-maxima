import { redirect } from "next/navigation";
import { readSession } from "@/lib/admin/auth";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  redirect(`/admin?id=${id}`);
}
