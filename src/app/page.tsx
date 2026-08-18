import { headers } from "next/headers";
import { connection } from "next/server";
import { LandingPage } from "@/components/landing/LandingPage";
import { getPublicBanner } from "@/lib/banner/service";
import { HOME_BANNER_SLOT, HOME_FORM_BANNER_SLOT } from "@/lib/banner/types";
import { listLandingHallShowcase } from "@/lib/catalog/showcase";
import { getPublicCarousel } from "@/lib/carousel/service";
import { getPublicEventPromo } from "@/lib/events/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Home() {
  await headers();
  await connection();
  const [banner, formBanner, carousel, hallShowcase, eventsPromo] = await Promise.all([
    getPublicBanner(HOME_BANNER_SLOT),
    getPublicBanner(HOME_FORM_BANNER_SLOT),
    getPublicCarousel(),
    listLandingHallShowcase(),
    getPublicEventPromo(),
  ]);
  return (
    <LandingPage
      source="/"
      banner={banner}
      formBanner={formBanner}
      carousel={carousel}
      hallShowcase={hallShowcase}
      eventsPromo={eventsPromo}
    />
  );
}
