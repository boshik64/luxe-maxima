import Link from "next/link";
import {
  AutumnCardAccent,
  type AutumnAccentKind,
} from "@/components/landing/AutumnDecor";
import { PRODUCT_LIST, type ProductId } from "@/lib/products";

const ACCENT_BY_PRODUCT: Record<ProductId, AutumnAccentKind> = {
  keys: "seat",
  group: "ticket",
  event: "reel",
};

export function Products({
  onSelect,
}: {
  onSelect?: (id: ProductId) => void;
}) {
  return (
    <section id="products" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <p className="mb-3 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-gold uppercase">
        Услуги
      </p>
      <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
        Три способа занять зал
      </h2>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PRODUCT_LIST.map((product) => (
          <article
            key={product.id}
            className="autumn-card relative flex flex-col rounded-3xl border border-line bg-card p-6 transition"
          >
            <AutumnCardAccent kind={ACCENT_BY_PRODUCT[product.id]} />
            <p className="text-xs tracking-[0.2em] text-gold uppercase">
              {product.kicker}
            </p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl">
              {product.title}
            </h3>
            <p className="mt-3 flex-1 text-muted">{product.summary}</p>
            <ul className="mt-6 space-y-2 text-sm text-foreground/90">
              {product.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(product.id)}
                className="mt-8 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {product.cta}
              </button>
            ) : (
              <Link
                href={`/${product.slug}#form`}
                className="mt-8 inline-flex justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {product.cta}
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
