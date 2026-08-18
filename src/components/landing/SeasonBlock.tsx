"use client";

import { useEffect, useState } from "react";
import { HashLink } from "@/components/ui/HashLink";
import { parseResponseJson } from "@/lib/api-json";
import {
  isExternalCarouselHref,
  type PublicCarousel,
  type PublicCarouselSlide,
} from "@/lib/carousel/types";

function Cta({ href, label }: { href: string; label: string }) {
  const className =
    "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:brightness-110";
  if (isExternalCarouselHref(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }
  return (
    <HashLink href={href} className={className}>
      {label}
    </HashLink>
  );
}

function Slide({ item }: { item: PublicCarouselSlide }) {
  const image = (
    <div className="season-carousel-art">
      {/* Пользовательский кадр неизвестного размера */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.imageUrl} alt={item.alt || item.title} />
    </div>
  );
  const copy = (
    <div className="season-carousel-copy">
      {item.kicker ? (
        <p className="mb-3 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
          {item.kicker}
        </p>
      ) : null}
      <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
        {item.title}
      </h2>
      {item.body ? (
        <p className="mt-5 max-w-2xl whitespace-pre-line text-lg text-muted">
          {item.body}
        </p>
      ) : null}
      {item.ctaLabel ? (
        <div className="mt-9">
          <Cta href={item.ctaHref || "#form"} label={item.ctaLabel} />
        </div>
      ) : null}
    </div>
  );

  return (
    <article
      className={`season-carousel-slide ${
        item.layout === "image-right" ? "is-image-right" : "is-image-left"
      }`}
    >
      {image}
      {copy}
    </article>
  );
}

export function SeasonBlock({
  initial,
}: {
  initial?: PublicCarousel | null;
}) {
  const [data, setData] = useState<PublicCarousel | null>(initial ?? null);
  const [slides, setSlides] = useState<PublicCarouselSlide[]>(initial?.items ?? []);
  const [index, setIndex] = useState(0);
  const intervalSeconds = data?.intervalSeconds ?? 6;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/carousel", { cache: "no-store" })
      .then((response) => parseResponseJson<PublicCarousel>(response))
      .then((next) => {
        if (cancelled || !next.items) return;
        setData(next);
        setSlides(next.items);
        setIndex(0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [slides.length, intervalSeconds, index]);

  if (!slides.length) return null;

  function go(step: number) {
    setIndex((current) => (current + step + slides.length) % slides.length);
  }

  return (
    <section className="autumn-only autumn-season season-carousel" aria-roledescription="carousel">
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        {slides.length > 1 ? (
          <>
            <button
              type="button"
              className="season-carousel-arrow is-prev"
              aria-label="Предыдущий пост"
              onClick={() => go(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="season-carousel-arrow is-next"
              aria-label="Следующий пост"
              onClick={() => go(1)}
            >
              ›
            </button>
          </>
        ) : null}
        <div className="season-carousel-viewport">
          <div
            className="season-carousel-track"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((item) => (
              <div key={item.id} className="season-carousel-item">
                <Slide item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
