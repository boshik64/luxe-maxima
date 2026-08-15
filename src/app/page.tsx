import { headers } from "next/headers";
import { connection } from "next/server";
import { LandingPage } from "@/components/landing/LandingPage";
import { getPublicBanner } from "@/lib/banner/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Home() {
  await headers();
  await connection();
  const banner = await getPublicBanner();
  return <LandingPage source="/" banner={banner} />;
}
