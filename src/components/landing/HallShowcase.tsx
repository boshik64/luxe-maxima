"use client";

import { useEffect, useState } from "react";
import { parseResponseJson } from "@/lib/api-json";
import type { PublicHallShowcaseItem } from "@/lib/catalog/admin-types";

export function HallShowcase({
  initial = [],
}: {
  initial?: PublicHallShowcaseItem[];
}) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hall-showcase", { cache: "no-store" })
      .then((response) =>
        parseResponseJson<{ items?: PublicHallShowcaseItem[] }>(response),
      )
      .then((data) => {
        if (!cancelled && Array.isArray(data.items) && data.items.length) {
          setItems(data.items);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items.length) return null;

  return (
    <section className="autumn-only hall-showcase" aria-label="Форматы залов">
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-16 sm:pt-8 sm:pb-24">
        <div className="hall-showcase-grid">
          {items.map((item) => (
            <figure key={item.id} className="hall-showcase-item">
              <div className="hall-showcase-art">
                {/* Кадр зала произвольного размера */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.formatName} />
              </div>
              <figcaption className="hall-showcase-caption">{item.formatName}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
