import { redirect } from "next/navigation";
import { FeedbackInbox } from "@/components/admin/feedback/FeedbackInbox";
import { readSession } from "@/lib/admin/auth";

export default async function AdminFeedbackPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <FeedbackInbox />;
}
