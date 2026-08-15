"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function HashLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    const url = new URL(href, window.location.href);
    const samePage = url.pathname === window.location.pathname;
    if (!samePage || !url.hash) return;
    event.preventDefault();
    scrollToHash(url.hash);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  if (href.startsWith("http")) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
