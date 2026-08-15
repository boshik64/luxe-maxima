import { redirect } from "next/navigation";
import { readSession } from "@/lib/admin/auth";

export default async function AdminCatalogsIndex() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  redirect("/admin/catalogs/formats");
}
