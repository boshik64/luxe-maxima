import type { Metadata } from "next";
import { Caveat, Manrope, Oswald, Unbounded } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

// Акцидентный заголовочный шрифт сезонной темы.
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

// Рукописный — только для коротких заметок на полях.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
});

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
      className={`${manrope.variable} ${unbounded.variable} ${oswald.variable} ${caveat.variable} ${themeClass} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
