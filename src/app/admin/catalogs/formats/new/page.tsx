import { redirect } from "next/navigation";
import { FormatEditor } from "@/components/admin/catalog/FormatEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminNewFormatPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <FormatEditor />;
}
