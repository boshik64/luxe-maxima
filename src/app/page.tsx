import { LandingPage } from "@/components/landing/LandingPage";
import { getPublicBanner } from "@/lib/banner/service";

export default async function Home() {
  const banner = await getPublicBanner();
  return <LandingPage source="/" banner={banner} />;
}
