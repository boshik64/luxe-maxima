import Link from "next/link";
import { Logo } from "@/components/Logo";
import { KARO_SITE_URL } from "@/lib/contacts";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <a
          href={KARO_SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground"
          aria-label="Сайт КАРО"
        >
          <Logo />
        </a>
        <nav aria-label="Основная навигация" className="flex items-center gap-4">
          <Link
            href="/feedback"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Контакты
          </Link>
        </nav>
      </div>
    </header>
  );
}
