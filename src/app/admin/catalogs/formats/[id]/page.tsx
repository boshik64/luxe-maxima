import { redirect } from "next/navigation";
import { FormatEditor } from "@/components/admin/catalog/FormatEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminFormatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  return <FormatEditor id={id} />;
}
