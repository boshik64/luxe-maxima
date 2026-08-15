import { connection } from "next/server";
import { LandingPage } from "@/components/landing/LandingPage";
import { getPublicBanner } from "@/lib/banner/service";

export const dynamic = "force-dynamic";

export default async function Home() {
  await connection();
  const banner = await getPublicBanner();
  return <LandingPage source="/" banner={banner} />;
}
