"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Заявки" },
  { href: "/admin/catalogs", label: "Справочники" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <nav className="flex flex-wrap gap-2" aria-label="Разделы админки">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm ${
                active
                  ? "bg-primary text-white"
                  : "border border-line text-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        className="rounded-full border border-line px-4 py-2 text-sm"
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          router.push("/admin/login");
        }}
      >
        Выйти
      </button>
    </div>
  );
}
