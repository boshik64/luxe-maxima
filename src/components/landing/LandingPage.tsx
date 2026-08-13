"use client";

import { useState } from "react";
import { ApplicationForm } from "@/components/form/ApplicationForm";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Products } from "@/components/landing/Products";
import { PRODUCTS, type ProductId } from "@/lib/products";

export function LandingPage({
  initialProduct,
  lockProduct = false,
  source = "/",
}: {
  initialProduct?: ProductId;
  lockProduct?: boolean;
  source?: string;
}) {
  const [productId, setProductId] = useState<ProductId>(initialProduct ?? "keys");
  const product = PRODUCTS[productId];

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
        />
        {lockProduct ? null : <Products onSelect={selectProduct} />}
        <section id="form" className="mx-auto max-w-6xl px-4 pb-24">
          <p className="mb-3 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
            Заявка
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            {product.title}
          </h2>
          <p className="mt-3 mb-8 max-w-2xl text-muted">
            Поля зависят от услуги. Город, кинотеатр, фильм и сеанс подгружаются
            из расписания КАРО. Если сеанса нет — укажите своё время.
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
