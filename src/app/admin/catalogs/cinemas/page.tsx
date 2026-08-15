import { redirect } from "next/navigation";
import { CinemasList } from "@/components/admin/catalog/CinemasList";
import { readSession } from "@/lib/admin/auth";

export default async function AdminCinemasPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <CinemasList />;
}
