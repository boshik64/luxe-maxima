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
import "./globals.css";

// NEXT_PUBLIC_SITE_THEME=classic возвращает прежнее оформление без правок кода.
const themeClass =
  process.env.NEXT_PUBLIC_SITE_THEME === "classic" ? "" : "theme-autumn";

export const metadata: Metadata = {
  title: "Осень в КАРО — заберите зал себе",
  description:
    "Частный сеанс или мероприятие в кинотеатрах КАРО. Оставьте заявку — менеджер подберёт зал, время и формат.",
  openGraph: {
    title: "Осень в КАРО — заберите зал себе",
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
      className={`${themeClass} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
