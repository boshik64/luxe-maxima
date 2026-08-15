import { redirect } from "next/navigation";
import { FeedbackDetail } from "@/components/admin/feedback/FeedbackDetail";
import { readSession } from "@/lib/admin/auth";

export default async function AdminFeedbackItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;
  return <FeedbackDetail id={id} />;
}
