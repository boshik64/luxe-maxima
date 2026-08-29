import type { PublicHallShowcaseItem } from "@/lib/catalog/admin-types";
import { getPublicHallShowcase } from "@/lib/catalog/service";
import { bannerPublicUrl } from "@/lib/uploads";

export async function listLandingHallShowcase(): Promise<PublicHallShowcaseItem[]> {
  const items = await getPublicHallShowcase();
  return items.map((item) => ({
    ...item,
    imageUrl: bannerPublicUrl(item.imageUrl),
  }));
}
