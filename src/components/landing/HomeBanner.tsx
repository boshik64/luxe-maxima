import type { PublicBanner } from "@/lib/banner/types";

export function HomeBanner({ banner }: { banner: PublicBanner }) {
  const src = `${banner.imageUrl}?v=${encodeURIComponent(banner.updatedAt)}`;
  const image = (
    // Пользовательский файл неизвестного размера — показываем целиком, без обрезки.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={banner.alt || "Баннер"}
      className="h-auto w-full"
    />
  );

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:py-8">
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-lg">
          {banner.href ? (
            <a
              href={banner.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {image}
            </a>
          ) : (
            image
          )}
        </div>
      </div>
    </section>
  );
}
