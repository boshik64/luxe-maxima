import { redirect } from "next/navigation";
import { CinemaEditor } from "@/components/admin/catalog/CinemaEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminNewCinemaPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <CinemaEditor />;
}
