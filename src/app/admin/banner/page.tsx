import { redirect } from "next/navigation";
import { BannerHub } from "@/components/admin/banner/BannerHub";
import { readSession } from "@/lib/admin/auth";

export default async function AdminBannerPage() {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return <BannerHub />;
}
