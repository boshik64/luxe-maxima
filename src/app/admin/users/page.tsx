import { redirect } from "next/navigation";
import { UsersList } from "@/components/admin/users/UsersList";
import { readSession } from "@/lib/admin/auth";

export default async function AdminUsersPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN") redirect("/admin");
  return <UsersList />;
}
