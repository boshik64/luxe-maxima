"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

const sections = [
  { href: "/admin/catalogs/formats", label: "Форматы зала" },
  { href: "/admin/catalogs/cinemas", label: "Кинотеатры" },
  { href: "/admin/catalogs/halls", label: "Залы" },
];

export function CatalogShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-6 py-8">
      <AdminNav />
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Справочники">
        {sections.map((section) => {
          const active =
            pathname === section.href || pathname.startsWith(`${section.href}/`);
          return (
            <Link
              key={section.href}
              href={section.href}
              className={`rounded-full px-4 py-2 text-sm ${
                active
                  ? "bg-primary text-white"
                  : "border border-line text-muted hover:text-foreground"
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}

export function CatalogBack({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-block text-sm text-gold underline underline-offset-4"
    >
      {label}
    </Link>
  );
}
