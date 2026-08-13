import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { readSession } from "@/lib/admin/auth";

export default async function AdminPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return (
    <Suspense fallback={<p className="px-4 py-10 text-muted">Загрузка доски…</p>}>
      <AdminDashboard />
    </Suspense>
  );
}
