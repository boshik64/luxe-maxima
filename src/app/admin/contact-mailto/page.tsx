import { redirect } from "next/navigation";
import { ContactMailtoEditor } from "@/components/admin/ContactMailtoEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminContactMailtoPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN") redirect("/admin");
  return <ContactMailtoEditor />;
}
