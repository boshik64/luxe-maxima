import Link from "next/link";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/", label: "Все услуги" },
  { href: "/keys", label: "Ключи от зала" },
  { href: "/group", label: "Групповые походы" },
  { href: "/event", label: "Мероприятие" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="text-foreground" aria-label="На главную">
          <Logo />
        </Link>
        <nav aria-label="Основная навигация" className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden text-sm text-muted transition hover:text-foreground lg:inline"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#products"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Оставить заявку
          </Link>
        </nav>
      </div>
    </header>
  );
}
