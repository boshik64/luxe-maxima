import { redirect } from "next/navigation";
import { HallEditor } from "@/components/admin/catalog/HallEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminNewHallPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <HallEditor />;
}
