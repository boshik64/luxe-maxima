export type SiteTheme = "classic" | "autumn" | "winter";

/** Текущая тема публичной части (NEXT_PUBLIC_SITE_THEME). По умолчанию — зима. */
export function getSiteTheme(): SiteTheme {
  const raw = process.env.NEXT_PUBLIC_SITE_THEME;
  if (raw === "classic" || raw === "autumn" || raw === "winter") return raw;
  return "winter";
}

/** Классы на <html>: зима держит осеннюю раскладку блоков и поверх неё зимние токены. */
export function getSiteThemeClass(theme: SiteTheme = getSiteTheme()): string {
  switch (theme) {
    case "classic":
      return "";
    case "autumn":
      return "theme-autumn";
    case "winter":
      return "theme-autumn theme-winter";
  }
}

export function getSeasonCampaignLabel(theme: SiteTheme = getSiteTheme()): string {
  if (theme === "winter") return "Зима в КАРО";
  if (theme === "autumn") return "Осень в КАРО";
  return "КАРО";
}

export function isWinterTheme(theme: SiteTheme = getSiteTheme()): boolean {
  return theme === "winter";
}
