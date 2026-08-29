import Image from "next/image";

/**
 * Декоративный слой кампании «Осень в КАРО»: коллажные кадры, штамп и
 * рукописные ремарки. Только оформление — данных и обработчиков здесь нет.
 * Фотографии лежат в public/autumn, заменяются файлом того же имени.
 */

export function AutumnHeroBanner() {
  return (
    <div className="autumn-only autumn-hero-banner">
      <Image
        src="/autumn/hero-banner.png"
        alt="Кресло КАРО с пледом и попкорном в полутёмном зале"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[82%_center]"
      />
      <span className="autumn-stamp">
        <span className="autumn-stamp-kicker">Аренда зала</span>
        <span className="autumn-stamp-from">от</span>
        <span className="autumn-stamp-price">8 000 ₽</span>
      </span>
    </div>
  );
}

export function AutumnTicketCollage() {
  return (
    <div className="autumn-collage autumn-collage-portrait">
      <div className="autumn-collage-frame autumn-collage-frame-portrait">
        <Image
          src="/autumn/ticket.jpg"
          alt="Билет кампании «Осень в КАРО»: сезон уютных впечатлений"
          fill
          sizes="(max-width: 1023px) 70vw, 360px"
          className="object-cover"
        />
      </div>
    </div>
  );
}

const CARD_ACCENTS = {
  ticket: (
    <svg viewBox="0 0 56 40" role="presentation" focusable="false">
      <rect
        x="3"
        y="6"
        width="50"
        height="28"
        rx="5"
        fill="none"
        stroke="#8c1c2a"
        strokeWidth="2.5"
      />
      <path d="M38 6v28" stroke="#8c1c2a" strokeWidth="2" strokeDasharray="4 4" />
      <path
        d="M11 16h20M11 24h13"
        stroke="#8c1c2a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="3" cy="20" r="4.5" fill="#f6efe2" stroke="#8c1c2a" strokeWidth="2" />
      <circle cx="53" cy="20" r="4.5" fill="#f6efe2" stroke="#8c1c2a" strokeWidth="2" />
    </svg>
  ),
  key: (
    <svg viewBox="0 0 56 40" role="presentation" focusable="false">
      <g fill="none" stroke="#8c1c2a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="16" cy="20" r="8.5" />
        <circle cx="16" cy="20" r="3.2" />
        <path d="M24.5 20h24" />
        <path d="M41 20v7M47.5 20v10" />
      </g>
    </svg>
  ),
  flute: (
    <svg viewBox="0 0 56 40" role="presentation" focusable="false">
      <g fill="none" stroke="#8c1c2a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M22 6h12l-2.2 16H24.2Z" />
        <path d="M28 22v10" />
        <path d="M22 34h12" />
        <path d="M24.5 14h7" />
        <circle cx="36" cy="9" r="1.6" fill="#8c1c2a" stroke="none" />
        <circle cx="40" cy="13" r="1.2" fill="#8c1c2a" stroke="none" />
        <circle cx="38.5" cy="6.5" r="1" fill="#8c1c2a" stroke="none" />
      </g>
    </svg>
  ),
  people: (
    <svg viewBox="0 0 56 40" role="presentation" focusable="false">
      <g fill="none" stroke="#8c1c2a" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="14" cy="13" r="4.2" />
        <path d="M6.5 33c.4-6.2 3.6-10.2 7.5-10.2S21.6 26.8 22 33" />
        <circle cx="28" cy="11" r="5" />
        <path d="M18 34.5c.5-7.4 4.4-12 10-12s9.5 4.6 10 12" />
        <circle cx="42" cy="13" r="4.2" />
        <path d="M34 33c.4-6.2 3.6-10.2 7.5-10.2S49.1 26.8 49.5 33" />
      </g>
    </svg>
  ),
} as const;

export type AutumnAccentKind = keyof typeof CARD_ACCENTS;

export function AutumnCardAccent({ kind }: { kind: AutumnAccentKind }) {
  return (
    <span className="autumn-only autumn-card-accent" aria-hidden="true">
      {CARD_ACCENTS[kind]}
    </span>
  );
}

export function ProductGlyph({ kind }: { kind: "key" | "flute" | "people" }) {
  return (
    <span className="form-product-glyph" aria-hidden="true">
      {CARD_ACCENTS[kind]}
    </span>
  );
}
