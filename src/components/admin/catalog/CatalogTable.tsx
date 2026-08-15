"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function CatalogTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-line bg-card">
      <table className="w-full min-w-[800px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-sm text-muted">
            {columns.map((column) => (
              <th key={column} className="px-5 py-4 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function CatalogRowLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-gold underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export const catalogRowClass =
  "border-b border-line last:border-0 transition hover:bg-background/80";
