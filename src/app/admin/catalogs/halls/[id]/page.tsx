import { redirect } from "next/navigation";
import { HallEditor } from "@/components/admin/catalog/HallEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminHallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  return <HallEditor id={id} />;
}
