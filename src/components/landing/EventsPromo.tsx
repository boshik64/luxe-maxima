"use client";

import { useEffect, useState } from "react";
import { parseResponseJson } from "@/lib/api-json";
import type { PublicEventPromo } from "@/lib/events/types";

export function EventsPromo({
  initial = null,
}: {
  initial?: PublicEventPromo | null;
}) {
  const [item, setItem] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/events", { cache: "no-store" })
      .then((response) =>
        parseResponseJson<{ item?: PublicEventPromo | null }>(response),
      )
      .then((data) => {
        if (!cancelled && data.item) setItem(data.item);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!item) return null;

  return (
    <section className="autumn-only event-promo" aria-labelledby="event-promo-title">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        {item.kicker ? (
          <p className="mb-3 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
            {item.kicker}
          </p>
        ) : null}
        <h2
          id="event-promo-title"
          className="max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl"
        >
          {item.title}
        </h2>
        {item.intro ? (
          <p className="mt-5 max-w-3xl text-lg text-muted">{item.intro}</p>
        ) : null}

        {item.occasions.length ? (
          <div className="event-promo-occasions">
            {item.occasions.map((occasion, index) => (
              <article key={`${occasion.title}-${index}`} className="event-promo-card">
                <h3>{occasion.title}</h3>
                {occasion.body ? <p>{occasion.body}</p> : null}
              </article>
            ))}
          </div>
        ) : null}

        {item.eventTypes.length || item.capabilities.length ? (
          <div className="event-promo-lists">
            {item.eventTypes.length ? (
              <ul>
                {item.eventTypes.map((line, index) => (
                  <li key={`type-${index}`}>{line}</li>
                ))}
              </ul>
            ) : null}
            {item.capabilities.length ? (
              <ul>
                {item.capabilities.map((line, index) => (
                  <li key={`cap-${index}`}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {item.highlights.length ? (
          <div className="event-promo-highlights">
            {item.highlights.map((line, index) => (
              <p key={`hi-${index}`}>{line}</p>
            ))}
          </div>
        ) : null}

        {item.presentationLabel && item.presentationHref ? (
          <p className="event-promo-pdf">
            <a
              href={item.presentationHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.presentationLabel}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
