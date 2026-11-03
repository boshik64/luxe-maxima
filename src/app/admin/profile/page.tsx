import { redirect } from "next/navigation";
import { UserEditor } from "@/components/admin/users/UserEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminProfilePage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <UserEditor id={session.sub} />;
}
