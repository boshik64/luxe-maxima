"use client";

import { useEffect, useState } from "react";
import { parseResponseJson } from "@/lib/api-json";
import {
  EVENT_HIGHLIGHT_ICONS,
  type PublicEventPromo,
} from "@/lib/events/types";

function FileGlyph() {
  return (
    <svg
      className="event-promo-pdf-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V8h5.5L13 3.5zM8 12h8v1.5H8V12zm0 3.5h8V17H8v-1.5z"
      />
    </svg>
  );
}

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

        {item.highlights.length ? (
          <div className="event-promo-highlights">
            {item.highlights.map((line, index) => {
              const icon = EVENT_HIGHLIGHT_ICONS[index];
              return (
                <p key={`hi-${index}`}>
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt="" width={56} height={56} />
                  ) : null}
                  <span>{line}</span>
                </p>
              );
            })}
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

        {item.presentationLabel && item.presentationHref ? (
          <p className="event-promo-pdf">
            <a
              href={item.presentationHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileGlyph />
              <span>{item.presentationLabel}</span>
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
