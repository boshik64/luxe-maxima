import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/unbounded/400.css";
import "@fontsource/unbounded/500.css";
import "@fontsource/unbounded/600.css";
import "@fontsource/unbounded/700.css";
import "@fontsource/oswald/500.css";
import "@fontsource/oswald/600.css";
import "@fontsource/oswald/700.css";
import "@fontsource/caveat/500.css";
import "@fontsource/caveat/600.css";
import { WinterEffectsProvider } from "@/components/landing/WinterEffects";
import { WinterSnow } from "@/components/landing/WinterSnow";
import {
  getSeasonCampaignLabel,
  getSiteTheme,
  getSiteThemeClass,
} from "@/lib/site-theme";
import "./globals.css";

const siteTheme = getSiteTheme();
const themeClass = getSiteThemeClass(siteTheme);
const campaign = getSeasonCampaignLabel(siteTheme);

export const metadata: Metadata = {
  title: `${campaign} — заберите зал себе`,
  description:
    "Частный сеанс или мероприятие в кинотеатрах КАРО. Оставьте заявку — менеджер подберёт зал, время и формат.",
  openGraph: {
    title: `${campaign} — заберите зал себе`,
    description:
      "Свой фильм, своя компания, свой вечер: аренда зала и мероприятия в КАРО.",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${themeClass} h-full antialiased`.trim()}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <WinterEffectsProvider>
          <WinterSnow />
          {children}
        </WinterEffectsProvider>
      </body>
    </html>
  );
}
