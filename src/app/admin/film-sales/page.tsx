import { redirect } from "next/navigation";
import { FilmSalesEditor } from "@/components/admin/FilmSalesEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminFilmSalesPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <FilmSalesEditor />;
}
