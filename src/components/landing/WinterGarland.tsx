"use client";

import { useWinterEffects } from "@/components/landing/WinterEffects";

const BULBS = 32;
/** Насколько сильно провисает середина (в единицах viewBox). */
const SAG = 42;

/**
 * Гирлянда на всю ширину после hero-баннера, с заметным провисанием.
 */
export function WinterGarland() {
  const { available } = useWinterEffects();
  // Гирлянда остаётся даже когда снег выключен снежинкой.
  if (!available) return null;

  const width = BULBS * 40;
  const height = SAG + 28;
  // Квадратичная кривая: края высоко, середина провисает.
  const wirePath = `M0 12 Q ${width / 2} ${12 + SAG} ${width} 12`;

  return (
    <div className="winter-garland" aria-hidden="true">
      <svg
        className="winter-garland-wire"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <path
          d={wirePath}
          fill="none"
          stroke="rgba(180,200,220,0.5)"
          strokeWidth="1.6"
        />
        {Array.from({ length: BULBS }, (_, i) => {
          const t = i / (BULBS - 1);
          // Точка на квадратичной кривой Bezier: (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
          const x = t * width;
          const y = 12 + 2 * (1 - t) * t * SAG;
          const tone = i % 4;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="5"
                stroke="rgba(180,200,220,0.45)"
                strokeWidth="1"
              />
              <ellipse
                className={`winter-garland-bulb-svg is-${tone}`}
                cx="0"
                cy="10"
                rx="5.2"
                ry="6.4"
                style={{ animationDelay: `${(i % 7) * 0.22}s` }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
