"use client";

import { useEffect, useState } from "react";
import { ApplicationForm } from "@/components/form/ApplicationForm";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HomeBanner } from "@/components/landing/HomeBanner";
import { Products } from "@/components/landing/Products";
import { parseResponseJson } from "@/lib/api-json";
import type { PublicBanner } from "@/lib/banner/types";
import { PRODUCTS, type ProductId } from "@/lib/products";

export function LandingPage({
  initialProduct,
  lockProduct = false,
  source = "/",
  banner = null,
}: {
  initialProduct?: ProductId;
  lockProduct?: boolean;
  source?: string;
  banner?: PublicBanner | null;
}) {
  const [productId, setProductId] = useState<ProductId>(initialProduct ?? "keys");
  const [liveBanner, setLiveBanner] = useState<PublicBanner | null>(banner);
  const product = PRODUCTS[productId];

  useEffect(() => {
    if (lockProduct) return;
    let cancelled = false;
    fetch("/api/banners", { cache: "no-store" })
      .then(async (response) => {
        const data = await parseResponseJson<{ item?: PublicBanner | null }>(response);
        if (!cancelled && response.ok) setLiveBanner(data.item ?? null);
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
          kicker={lockProduct ? product.kicker : "Роскошный максимум"}
          title={
            lockProduct
              ? product.title
              : "Ключи от зала, групповой поход и мероприятие"
          }
          text={
            lockProduct
              ? product.summary
              : "Три лендинга услуг и сводная страница. Все заявки падают в одну административную панель."
          }
          ctaHref={lockProduct ? "#form" : "#products"}
        />
        {lockProduct || !liveBanner ? null : <HomeBanner banner={liveBanner} />}
        {lockProduct ? null : <Products onSelect={selectProduct} />}
        <section id="form" className="mx-auto max-w-6xl px-4 pb-24">
          <p className="mb-3 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
            Заявка
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            {product.title}
          </h2>
          <p className="mt-3 mb-8 max-w-2xl text-muted">
            {lockProduct
              ? product.summary
              : "Сначала выберите услугу выше. Поля формы зависят от продукта: аренда зала — из каталога, групповой поход — из расписания КАРО."}
          </p>
          <ApplicationForm
            productId={productId}
            onProductChange={lockProduct ? undefined : setProductId}
            lockProduct={lockProduct}
            source={source}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
