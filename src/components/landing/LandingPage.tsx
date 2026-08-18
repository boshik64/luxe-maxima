"use client";

import { useEffect, useState } from "react";
import { ApplicationForm } from "@/components/form/ApplicationForm";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HomeBanner } from "@/components/landing/HomeBanner";
import { EventsPromo } from "@/components/landing/EventsPromo";
import { HallShowcase } from "@/components/landing/HallShowcase";
import { Products } from "@/components/landing/Products";
import { SeasonBlock } from "@/components/landing/SeasonBlock";
import { parseResponseJson } from "@/lib/api-json";
import {
  HOME_BANNER_SLOT,
  HOME_FORM_BANNER_SLOT,
  type PublicBanner,
} from "@/lib/banner/types";
import type { PublicHallShowcaseItem } from "@/lib/catalog/admin-types";
import type { PublicCarousel } from "@/lib/carousel/types";
import type { PublicEventPromo } from "@/lib/events/types";
import { PRODUCTS, type ProductId } from "@/lib/products";

export function LandingPage({
  initialProduct,
  lockProduct = false,
  source = "/",
  banner = null,
  formBanner = null,
  carousel = null,
  hallShowcase = [],
  eventsPromo = null,
}: {
  initialProduct?: ProductId;
  lockProduct?: boolean;
  source?: string;
  banner?: PublicBanner | null;
  formBanner?: PublicBanner | null;
  carousel?: PublicCarousel | null;
  hallShowcase?: PublicHallShowcaseItem[];
  eventsPromo?: PublicEventPromo | null;
}) {
  const [productId, setProductId] = useState<ProductId | undefined>(initialProduct);
  const [liveBanner, setLiveBanner] = useState<PublicBanner | null>(banner);
  const [liveFormBanner, setLiveFormBanner] = useState<PublicBanner | null>(formBanner);
  const product = productId ? PRODUCTS[productId] : null;

  useEffect(() => {
    if (lockProduct) return;
    let cancelled = false;
    Promise.all([
      fetch(`/api/banners?slot=${HOME_BANNER_SLOT}`, { cache: "no-store" }),
      fetch(`/api/banners?slot=${HOME_FORM_BANNER_SLOT}`, { cache: "no-store" }),
    ])
      .then(async ([heroResponse, formResponse]) => {
        const heroData = await parseResponseJson<{ item?: PublicBanner | null }>(
          heroResponse,
        );
        const formData = await parseResponseJson<{ item?: PublicBanner | null }>(
          formResponse,
        );
        if (!cancelled && heroResponse.ok) setLiveBanner(heroData.item ?? null);
        if (!cancelled && formResponse.ok) setLiveFormBanner(formData.item ?? null);
      })
      .catch(() => {
        // оставляем серверное значение, если живой API недоступен
      });
    return () => {
      cancelled = true;
    };
  }, [lockProduct]);

  function selectProduct(id: ProductId) {
    setProductId(id);
    document.getElementById("form")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Header />
      <main>
        <Hero
          kicker={lockProduct ? product?.kicker ?? "" : "Осень в КАРО"}
          title={lockProduct ? product?.title ?? "" : "Тёплый сезон — в тёмном зале"}
          text={
            lockProduct
              ? product?.summary ?? ""
              : "Заберите себе целый зал: свой фильм, своя компания, свой вечер. Подберём кинотеатр, время и формат — от камерного сеанса до корпоратива."
          }
          ctaHref={lockProduct ? "#form" : "#products"}
        />
        {lockProduct || !liveBanner ? null : <HomeBanner banner={liveBanner} />}
        {lockProduct ? null : <Products onSelect={selectProduct} />}
        {lockProduct || !liveFormBanner ? null : (
          <HomeBanner banner={liveFormBanner} />
        )}
        <section id="form" className="mx-auto max-w-6xl px-4 pb-24">
          <p className="mb-3 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
            Заявка
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            {product?.title ?? "Оставьте заявку"}
          </h2>
          <p className="mt-3 mb-8 max-w-2xl text-muted">
            {lockProduct
              ? product?.summary
              : "Сначала выберите услугу — дальше форма откроется шаг за шагом."}
          </p>
          <ApplicationForm
            productId={productId}
            onProductChange={lockProduct ? undefined : setProductId}
            lockProduct={lockProduct}
            source={source}
          />
        </section>
        {lockProduct ? null : <SeasonBlock initial={carousel} />}
        {lockProduct ? null : <HallShowcase initial={hallShowcase} />}
        {lockProduct ? null : <EventsPromo initial={eventsPromo} />}
      </main>
      <Footer />
    </>
  );
}
