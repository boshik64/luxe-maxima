import Image from "next/image";

/**
 * Декоративный слой кампании «Осень в КАРО»: коллажные кадры, штамп и
 * рукописные ремарки. Только оформление — данных и обработчиков здесь нет.
 * Фотографии лежат в public/autumn, заменяются файлом того же имени.
 */

export function AutumnHeroCollage({ note }: { note: string }) {
  return (
    <div className="autumn-only autumn-collage-wrap">
      <figure className="autumn-collage">
        <div className="autumn-collage-frame">
          <Image
            src="/autumn/hero.jpg"
            alt="Кресло КАРО с ведёрком попкорна на осенней веранде"
            fill
            priority
            sizes="(max-width: 1023px) 92vw, 620px"
            className="object-cover"
          />
        </div>
        <figcaption className="autumn-collage-caption">
          <span className="autumn-note">{note}</span>
        </figcaption>
      </figure>
      <span className="autumn-stamp" aria-hidden="true">
        <span>твой</span>
        <span>сезон кино</span>
        <span className="autumn-stamp-sub">август — октябрь</span>
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
  seat: (
    <svg viewBox="0 0 56 40" role="presentation" focusable="false">
      <g fill="none" stroke="#8c1c2a" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M16 8h24a6 6 0 0 1 6 6v12H10V14a6 6 0 0 1 6-6z" />
        <path d="M8 20h6v14H8zM42 20h6v14h-6z" />
        <path d="M14 26h28v8H14z" />
      </g>
    </svg>
  ),
  reel: (
    <svg viewBox="0 0 56 40" role="presentation" focusable="false">
      <rect
        x="5"
        y="7"
        width="46"
        height="26"
        rx="3"
        fill="none"
        stroke="#8c1c2a"
        strokeWidth="2.5"
      />
      <g fill="#8c1c2a">
        <rect x="9" y="11" width="5" height="5" rx="1" />
        <rect x="9" y="24" width="5" height="5" rx="1" />
        <rect x="42" y="11" width="5" height="5" rx="1" />
        <rect x="42" y="24" width="5" height="5" rx="1" />
      </g>
      <circle cx="28" cy="20" r="7" fill="none" stroke="#8c1c2a" strokeWidth="2.5" />
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
