import { redirect } from "next/navigation";
import { HallsList } from "@/components/admin/catalog/HallsList";
import { readSession } from "@/lib/admin/auth";

export default async function AdminHallsPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <HallsList />;
}
