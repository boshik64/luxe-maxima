"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const SHOW_BANNER_NAV = false; // true — снова показать пункт «Баннеры»
const SHOW_FEEDBACK_NAV = false; // true — снова показать пункт «Контакты» (бывш. обратная связь)

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  hidden?: boolean;
  adminOnly?: boolean;
};

const primaryLinks: NavLink[] = [
  { href: "/admin", label: "Заявки", exact: true },
  { href: "/admin/archive", label: "Архив" },
  { href: "/admin/banner", label: "Баннеры", hidden: !SHOW_BANNER_NAV },
  {
    href: "/admin/feedback",
    label: "Контакты",
    hidden: !SHOW_FEEDBACK_NAV,
  },
];

const menuLinks: NavLink[] = [
  { href: "/admin/catalogs", label: "Справочники" },
  { href: "/admin/film-sales", label: "Механики продажи" },
  { href: "/admin/events", label: "Мероприятия" },
  {
    href: "/admin/contact-mailto",
    label: "Шаблон письма",
    adminOnly: true,
  },
  { href: "/admin/users", label: "Пользователи", adminOnly: true },
];

function isActive(pathname: string, link: NavLink) {
  return link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function NavPill({
  href,
  label,
  active,
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm ${
        active
          ? "bg-primary text-white"
          : "border border-line text-muted hover:text-foreground"
      }`}
    >
      {label}
      {badge && badge > 0 ? (
        <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs text-background">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<string | null>(null);
  const [feedbackNewCount, setFeedbackNewCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isAdmin = role === "ADMIN";

  const visiblePrimary = primaryLinks.filter(
    (link) => !link.hidden && (!link.adminOnly || isAdmin),
  );
  const visibleMenu = menuLinks.filter(
    (link) => !link.hidden && (!link.adminOnly || isAdmin),
  );
  const menuHasActive = visibleMenu.some((link) => isActive(pathname, link));

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap items-center gap-2" aria-label="Разделы админки">
          {visibleMenu.length > 0 ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-label="Меню разделов"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                  menuOpen || menuHasActive
                    ? "bg-primary text-white"
                    : "border border-line text-muted hover:text-foreground"
                }`}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {menuOpen ? (
                <div
                  id={menuId}
                  role="menu"
                  className="absolute left-0 top-full z-40 mt-2 min-w-56 rounded-2xl border border-line bg-card p-2 shadow-lg"
                >
                  {visibleMenu.map((link) => {
                    const active = isActive(pathname, link);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        className={`block rounded-xl px-3 py-2 text-sm transition ${
                          active
                            ? "bg-primary text-white"
                            : "text-muted hover:bg-background hover:text-foreground"
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
          {visiblePrimary.map((link) => (
            <NavPill
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(pathname, link)}
              badge={
                link.href === "/admin/feedback" ? feedbackNewCount : undefined
              }
            />
          ))}
          <NavPill
            href="/admin/profile"
            label="Мой профиль"
            active={pathname.startsWith("/admin/profile")}
          />
        </nav>
        <div className="flex flex-wrap items-center gap-2">
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
      </div>
    </div>
  );
}
