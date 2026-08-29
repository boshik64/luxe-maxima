import { redirect } from "next/navigation";
import { EventsEditor } from "@/components/admin/EventsEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminEventsPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <EventsEditor />;
}
