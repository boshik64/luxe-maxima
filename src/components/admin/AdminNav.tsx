"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const SHOW_BANNER_NAV = false; // true — снова показать пункт «Баннер»

const links = [
  { href: "/admin", label: "Заявки" },
  { href: "/admin/catalogs", label: "Справочники" },
  { href: "/admin/banner", label: "Баннер", hidden: !SHOW_BANNER_NAV },
  { href: "/admin/feedback", label: "Обратная связь" },
  { href: "/admin/users", label: "Пользователи", adminOnly: true },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [feedbackNewCount, setFeedbackNewCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/me")
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as {
          role?: string;
          feedbackNewCount?: number;
        };
        setRole(data.role ?? "");
        setFeedbackNewCount(data.feedbackNewCount ?? 0);
      })
      .catch(() => undefined);
  }, [pathname]);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <nav className="flex flex-wrap gap-2" aria-label="Разделы админки">
        {links
          .filter((link) => !link.hidden && (!link.adminOnly || role === "ADMIN"))
          .map((link) => {
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
                {link.href === "/admin/feedback" && feedbackNewCount > 0 ? (
                  <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs text-background">
                    {feedbackNewCount}
                  </span>
                ) : null}
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
