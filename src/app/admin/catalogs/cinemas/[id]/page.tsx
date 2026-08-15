import { redirect } from "next/navigation";
import { CinemaEditor } from "@/components/admin/catalog/CinemaEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminCinemaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  return <CinemaEditor id={id} />;
}
