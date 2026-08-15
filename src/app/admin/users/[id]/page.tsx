import { redirect } from "next/navigation";
import { UserEditor } from "@/components/admin/users/UserEditor";
import { readSession } from "@/lib/admin/auth";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN") redirect("/admin");
  const { id } = await params;
  return <UserEditor id={id} />;
}
