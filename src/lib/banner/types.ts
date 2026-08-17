export const HOME_BANNER_SLOT = "home-hero-products";
export const HOME_FORM_BANNER_SLOT = "home-products-form";

export const BANNER_SLOTS = [HOME_BANNER_SLOT, HOME_FORM_BANNER_SLOT] as const;

export type BannerSlot = (typeof BANNER_SLOTS)[number];

export function parseBannerSlot(value: string | null | undefined): BannerSlot {
  if (value && (BANNER_SLOTS as readonly string[]).includes(value)) {
    return value as BannerSlot;
  }
  return HOME_BANNER_SLOT;
}

export type PublicBanner = {
  imageUrl: string;
  href: string | null;
  alt: string;
  updatedAt: string;
};
