import { redirect } from "next/navigation";
import { FormatsList } from "@/components/admin/catalog/FormatsList";
import { readSession } from "@/lib/admin/auth";

export default async function AdminFormatsPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <FormatsList />;
}
