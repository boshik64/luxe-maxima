import { redirect } from "next/navigation";
import { BannerEditor } from "@/components/admin/banner/BannerEditor";
import { readSession } from "@/lib/admin/auth";

export default async function AdminBannerPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <BannerEditor />;
}
