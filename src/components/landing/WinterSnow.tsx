"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useWinterEffects } from "@/components/landing/WinterEffects";
import { isWinterTheme } from "@/lib/site-theme";

const FLAKE_COUNT = 320;
const CELL = 3;
const MAX_SURFACE_DEPTH = 16;
const MAX_FLOOR_DEPTH = 72;
const SLOPE = 0.5;
/** Сколько массы от упавшей снежинки оседает на полу. */
const FLOOR_CATCH = 1.35;
/** Насколько шапка «налезает» на кнопку вниз (px). */
const OVERLAP = 4;
/** Выше этого — лишнее ссыпается к краям. */
const SPILL_RATIO = 0.62;

type Flake = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  depth: number;
  phase: number;
};

type Point = { x: number; y: number };

/** Запас сверху у canvas-шапки (рисуем выше верхнего края кнопки). */
const CAP_PAD = 18;

type Surface = {
  id: string;
  el: HTMLElement;
  cap: HTMLCanvasElement;
  capCtx: CanvasRenderingContext2D;
  radius: number;
  /** Контур в локальных координатах элемента (0,0 = левый верх). */
  points: Point[];
  /** Viewport-origin элемента — только для попадания снежинок. */
  originX: number;
  originY: number;
  width: number;
  heights: Float32Array;
  maxDepth: number;
  prevPosition: string;
};

let surfaceSeq = 0;

function ensureSurfaceId(el: HTMLElement) {
  if (!el.dataset.winterSurfaceId) {
    surfaceSeq += 1;
    el.dataset.winterSurfaceId = `ws-${surfaceSeq}`;
  }
  return el.dataset.winterSurfaceId;
}

function localRect(width: number, height: number) {
  return {
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

type Excavator = {
  x: number;
  dir: 1 | -1;
  active: boolean;
  wait: number;
  pile: number;
  /** Сглаженная высота снега под машиной — без дрожи. */
  snowSmooth: number;
};

/** Размер спрайта экскаватора на канвасе. */
const EXCAVATOR_W = 124;
/** Насколько колёса уходят в сугроб (px). */
const EXCAVATOR_SINK = 11;

function seedCap(heights: Float32Array, maxDepth: number) {
  const mid = (heights.length - 1) / 2;
  for (let i = 0; i < heights.length; i++) {
    const t = 1 - Math.abs(i - mid) / Math.max(1, mid);
    const base = 2.2 + Math.random() * 2.4;
    heights[i] = Math.min(maxDepth * 0.42, base + t * 2.8);
  }
}

function seedFloor(floor: Float32Array) {
  for (let i = 0; i < floor.length; i++) {
    floor[i] =
      14 +
      Math.sin(i * 0.11) * 5 +
      Math.sin(i * 0.03) * 4 +
      Math.random() * 6;
  }
}

function preferReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDesktop() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function surfaceSelector() {
  // Десктоп: крупные карточки + контакты + «Оставить заявку» в hero.
  // Мобайл: те же крупные + CTA-кнопки.
  if (isDesktop()) {
    return [
      "header nav a.rounded-full.bg-primary",
      ".hero-copy a.rounded-full.bg-primary",
      ".autumn-card",
      ".form-product-btn",
    ].join(",");
  }
  return [
    "header nav a.rounded-full.bg-primary",
    ".hero-copy a.rounded-full.bg-primary",
    ".autumn-card",
    ".form-product-btn",
    "a.rounded-full.bg-primary",
    "button.rounded-full.bg-primary",
  ].join(",");
}

function readTopRadius(el: HTMLElement, rect: DOMRect) {
  const style = getComputedStyle(el);
  const tl = parseFloat(style.borderTopLeftRadius) || 0;
  const tr = parseFloat(style.borderTopRightRadius) || 0;
  const cap = Math.min(rect.height / 2, rect.width / 2);
  return Math.min(Math.max(tl, tr), cap);
}

function topContour(rect: DOMRect, radius: number, arcSamples = 12): Point[] {
  const r = Math.min(radius, rect.height / 2, rect.width / 2);
  const points: Point[] = [];

  if (r < 1) {
    return [
      { x: rect.left, y: rect.top + OVERLAP },
      { x: rect.right, y: rect.top + OVERLAP },
    ];
  }

  const lx = rect.left + r;
  const rx = rect.right - r;
  const cy = rect.top + r;

  for (let i = 0; i <= arcSamples; i++) {
    const t = i / arcSamples;
    const a = Math.PI - (Math.PI / 2) * t;
    points.push({
      x: lx + r * Math.cos(a),
      y: cy - r * Math.sin(a) + OVERLAP,
    });
  }

  if (rx - lx > 2) {
    const flatSteps = Math.max(2, Math.ceil((rx - lx) / 8));
    for (let i = 1; i < flatSteps; i++) {
      const t = i / flatSteps;
      points.push({ x: lx + (rx - lx) * t, y: rect.top + OVERLAP });
    }
  }

  for (let i = 0; i <= arcSamples; i++) {
    const t = i / arcSamples;
    const a = Math.PI / 2 - (Math.PI / 2) * t;
    points.push({
      x: rx + r * Math.cos(a),
      y: cy - r * Math.sin(a) + OVERLAP,
    });
  }

  return points;
}

function resampleContour(points: Point[], cell = CELL): Point[] {
  if (points.length < 2) return points.map((p) => ({ ...p }));

  const out: Point[] = [{ ...points[0]! }];
  let acc = 0;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (segLen < 1e-4) continue;

    let consumed = 0;
    while (acc + (segLen - consumed) >= cell) {
      const need = cell - acc;
      const t = (consumed + need) / segLen;
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      });
      consumed += need;
      acc = 0;
    }
    acc += segLen - consumed;
  }

  const tip = points[points.length - 1]!;
  const end = out[out.length - 1]!;
  if (Math.hypot(tip.x - end.x, tip.y - end.y) > 1) out.push({ ...tip });
  return out;
}

function relaxHeights(h: Float32Array, maxDepth: number) {
  const maxDiff = SLOPE * CELL;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < h.length - 1; i++) {
      const d = h[i]! - h[i + 1]!;
      if (d > maxDiff) {
        const move = (d - maxDiff) * 0.5;
        h[i]! -= move;
        h[i + 1]! += move;
      } else if (d < -maxDiff) {
        const move = (-d - maxDiff) * 0.5;
        h[i]! += move;
        h[i + 1]! -= move;
      }
    }
  }
  for (let i = 0; i < h.length; i++) {
    h[i] = Math.max(0, Math.min(maxDepth, h[i]!));
  }
}

function makeFlake(w: number, h: number, fromTop: boolean): Flake {
  const depth = 0.45 + Math.random() * 0.55;
  return {
    x: Math.random() * (w + 80) - 40,
    y: fromTop ? -10 - Math.random() * 60 : Math.random() * h,
    vx: 0,
    vy: 0.55 + depth * 0.7,
    size: (1.3 + Math.random() * 2) * depth,
    depth,
    phase: Math.random() * Math.PI * 2,
  };
}

function spillFlake(
  flakes: Flake[],
  x: number,
  y: number,
  side: number,
  amount: number,
) {
  const n = Math.min(5, Math.max(1, Math.ceil(amount / 2.5)));
  for (let i = 0; i < n; i++) {
    flakes.push({
      x: x + (Math.random() - 0.5) * 3,
      y: y - 1,
      vx: side * (0.8 + Math.random() * 1.6) + (Math.random() - 0.5),
      vy: 1.1 + Math.random() * 1.6,
      size: 1.1 + Math.random() * 1.6,
      depth: 1,
      phase: Math.random() * 6,
    });
  }
}

/**
 * Снег, сугробы, экскаватор, гироскоп. Управляется тумблером в хедере.
 */
export function WinterSnow() {
  const pathname = usePathname();
  const { enabled } = useWinterEffects();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active =
    isWinterTheme() && enabled && !pathname?.startsWith("/admin");

  useEffect(() => {
    if (!active) return;
    if (preferReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let lastTs = performance.now();
    let time = 0;

    const flakes: Flake[] = [];
    let surfaces: Surface[] = [];
    let floor: Float32Array = new Float32Array(1);
    let floorSeeded = false;
    const excavator: Excavator = {
      x: 40,
      dir: 1,
      active: false,
      wait: 90,
      pile: 0,
      snowSmooth: 0,
    };
    const excavatorImg = new Image();
    let excavatorReady = false;
    excavatorImg.onload = () => {
      excavatorReady = true;
    };
    excavatorImg.src = "/winter/excavator.png";

    let wind = 0.15;
    let tiltX = 0;
    let tiltY = 0;
    let shakeBoost = 0;
    let pointerX = -1e9;
    let pointerY = -1e9;
    let pointerActive = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastAccel = { x: 0, y: 0, z: 0 };
    let motionHooked = false;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.max(1, Math.ceil(w / CELL));
      if (floor.length !== cols) {
        const next = new Float32Array(cols);
        next.set(floor.subarray(0, Math.min(floor.length, cols)));
        floor = next;
      }
      if (isDesktop()) {
        if (!floorSeeded) {
          seedFloor(floor);
          floorSeeded = true;
        }
      } else {
        floor.fill(0);
        floorSeeded = false;
      }

      if (flakes.length === 0) {
        for (let i = 0; i < FLAKE_COUNT; i++) flakes.push(makeFlake(w, h, false));
      } else if (flakes.length > FLAKE_COUNT) {
        flakes.length = FLAKE_COUNT;
      }
      rebuildSurfaces();
    }

    function disposeSurface(surface: Surface) {
      surface.cap.remove();
      if (surface.el.style.position === "relative") {
        surface.el.style.position = surface.prevPosition;
      }
    }

    function ensureCapCanvas(el: HTMLElement, prev?: Surface) {
      let cap = prev?.cap;
      let capCtx = prev?.capCtx;
      if (!cap || !cap.isConnected || cap.parentElement !== el) {
        cap?.remove();
        cap = document.createElement("canvas");
        cap.dataset.winterCap = "1";
        cap.setAttribute("aria-hidden", "true");
        cap.style.cssText = [
          "position:absolute",
          "left:0",
          `top:-${CAP_PAD}px`,
          "width:100%",
          `height:${CAP_PAD + 22}px`,
          "pointer-events:none",
          "z-index:6",
          "display:block",
        ].join(";");
        const ctx2 = cap.getContext("2d");
        if (!ctx2) return null;
        capCtx = ctx2;
        el.prepend(cap);
      }
      return { cap: cap!, capCtx: capCtx! };
    }

    function rebuildLocalContour(surface: Surface, width: number, height: number) {
      const radius = readTopRadius(surface.el, localRect(width, height));
      surface.radius = radius;
      const contour = resampleContour(topContour(localRect(width, height), radius));
      if (contour.length < 2) {
        surface.points = [];
        return;
      }
      if (contour.length !== surface.heights.length) {
        const nextH = new Float32Array(contour.length);
        if (surface.heights.length > 0) {
          for (let i = 0; i < nextH.length; i++) {
            const src = Math.floor(
              (i / Math.max(1, nextH.length - 1)) *
                (surface.heights.length - 1),
            );
            nextH[i] = surface.heights[src] ?? 0;
          }
        } else {
          seedCap(nextH, surface.maxDepth);
        }
        surface.heights = nextH;
      }
      surface.points = contour;
      surface.width = width;
    }

    function rebuildSurfaces() {
      const next: Surface[] = [];
      const seen = new Set<Element>();
      const byId = new Map(surfaces.map((s) => [s.id, s]));
      const nodes = document.querySelectorAll<HTMLElement>(surfaceSelector());
      nodes.forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        if (rect.width < 24 || rect.height < 12) return;

        const id = ensureSurfaceId(el);
        const prev = byId.get(id);
        const host = ensureCapCanvas(el, prev);
        if (!host) return;

        const prevPosition =
          prev?.prevPosition ??
          (el.style.position || "");
        if (getComputedStyle(el).position === "static") {
          el.style.position = "relative";
        }

        let heights: Float32Array;
        if (prev) {
          heights = prev.heights;
        } else {
          heights = new Float32Array(0);
        }

        const surface: Surface = {
          id,
          el,
          cap: host.cap,
          capCtx: host.capCtx,
          radius: prev?.radius ?? 0,
          points: prev?.points ?? [],
          originX: rect.left,
          originY: rect.top,
          width: prev?.width ?? 0,
          heights,
          maxDepth: MAX_SURFACE_DEPTH,
          prevPosition,
        };
        rebuildLocalContour(surface, rect.width, rect.height);
        if (surface.points.length < 2) {
          if (!prev) disposeSurface(surface);
          return;
        }
        sizeCapCanvas(surface);
        next.push(surface);
        byId.delete(id);
      });
      byId.forEach((orphan) => disposeSurface(orphan));
      surfaces = next;
    }

    /** Только origin для hit-test; шапка в DOM и не отстаёт от скролла. */
    function syncSurfaceOrigins() {
      for (const surface of surfaces) {
        if (!surface.el.isConnected) {
          surface.points = [];
          continue;
        }
        const rect = surface.el.getBoundingClientRect();
        surface.originX = rect.left;
        surface.originY = rect.top;
        if (Math.abs(rect.width - surface.width) > 1.5) {
          rebuildLocalContour(surface, rect.width, rect.height);
          sizeCapCanvas(surface);
        }
      }
    }

    function sizeCapCanvas(surface: Surface) {
      const dprCap = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(1, Math.ceil(surface.width));
      const ch = CAP_PAD + 22;
      if (
        surface.cap.width !== Math.floor(cw * dprCap) ||
        surface.cap.height !== Math.floor(ch * dprCap)
      ) {
        surface.cap.width = Math.floor(cw * dprCap);
        surface.cap.height = Math.floor(ch * dprCap);
        surface.capCtx.setTransform(dprCap, 0, 0, dprCap, 0, 0);
      }
    }

    function viewX(surface: Surface, localX: number) {
      return surface.originX + localX;
    }
    function viewY(surface: Surface, localY: number) {
      return surface.originY + localY;
    }

    function floorHeightAt(x: number) {
      const col = Math.max(0, Math.min(floor.length - 1, Math.floor(x / CELL)));
      return floor[col] ?? 0;
    }

    function spillExcess(surface: Surface) {
      if (surface.points.length === 0) return;
      const limit = surface.maxDepth * SPILL_RATIO;
      // Лишнее стекает к ближайшему краю и падает.
      for (let i = 0; i < surface.heights.length; i++) {
        const excess = surface.heights[i]! - limit;
        if (excess <= 0.15) continue;

        const toEdge = i < surface.heights.length / 2 ? -1 : 1;
        let moved = excess * 0.35;
        surface.heights[i]! -= moved;

        let j = i;
        while (moved > 0.05) {
          j += toEdge;
          if (j < 0 || j >= surface.heights.length) {
            const edge = toEdge < 0 ? 0 : surface.heights.length - 1;
            const p = surface.points[edge]!;
            spillFlake(
              flakes,
              viewX(surface, p.x),
              viewY(surface, p.y) - surface.heights[edge]!,
              toEdge,
              moved,
            );
            break;
          }
          const room = Math.max(0, limit - surface.heights[j]!);
          const give = Math.min(moved, room + excess * 0.1);
          surface.heights[j]! += give * 0.55;
          moved -= give;
          if (j === 0 || j === surface.heights.length - 1) {
            const p = surface.points[j]!;
            spillFlake(
              flakes,
              viewX(surface, p.x),
              viewY(surface, p.y) - surface.heights[j]!,
              toEdge,
              moved + surface.heights[j]! * 0.15,
            );
            surface.heights[j]! *= 0.75;
            break;
          }
        }
      }

      // Край всегда «скользкий»
      for (const edge of [0, surface.heights.length - 1]) {
        if (edge < 0 || edge >= surface.heights.length) continue;
        if (surface.heights[edge]! < surface.maxDepth * 0.35) continue;
        const p = surface.points[edge]!;
        const side = edge === 0 ? -1 : 1;
        const drop = surface.heights[edge]! * 0.12;
        surface.heights[edge]! -= drop;
        spillFlake(
          flakes,
          viewX(surface, p.x),
          viewY(surface, p.y) - surface.heights[edge]!,
          side,
          drop,
        );
      }
    }

    function deposit(surface: Surface, x: number, y: number, amount: number) {
      if (surface.points.length === 0) return false;
      let best = -1;
      let bestDist = 12;
      for (let i = 0; i < surface.points.length; i++) {
        const p = surface.points[i]!;
        const px = viewX(surface, p.x);
        const surfaceY = viewY(surface, p.y) - surface.heights[i]!;
        const d = Math.hypot(px - x, (surfaceY - y) * 1.35);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      if (best < 0) return false;

      const p = surface.points[best]!;
      const px = viewX(surface, p.x);
      const surfaceY = viewY(surface, p.y) - surface.heights[best]!;
      if (y > surfaceY + 4 || y < surfaceY - 12) return false;
      if (Math.abs(x - px) > CELL * 1.8) return false;

      surface.heights[best] = Math.min(
        surface.maxDepth,
        surface.heights[best]! + amount,
      );
      if (best > 0) {
        surface.heights[best - 1] = Math.min(
          surface.maxDepth,
          surface.heights[best - 1]! + amount * 0.16,
        );
      }
      if (best < surface.heights.length - 1) {
        surface.heights[best + 1] = Math.min(
          surface.maxDepth,
          surface.heights[best + 1]! + amount * 0.16,
        );
      }
      return true;
    }

    function brushSurfaces(dt: number) {
      if (!pointerActive) return;
      const dx = pointerX - lastPointerX;
      const dy = pointerY - lastPointerY;
      const speed = Math.hypot(dx, dy);
      if (speed < 0.8) return;

      for (const surface of surfaces) {
        for (let i = 0; i < surface.points.length; i++) {
          const p = surface.points[i]!;
          const px = viewX(surface, p.x);
          const py = viewY(surface, p.y);
          const top = py - surface.heights[i]!;
          if (Math.abs(pointerX - px) > 14) continue;
          if (pointerY < top - 16 || pointerY > py + 8) continue;
          const take = Math.min(surface.heights[i]!, (0.35 + speed * 0.05) * dt);
          if (take < 0.05) continue;
          surface.heights[i]! -= take;
          flakes.push({
            x: px,
            y: top,
            vx: dx * 0.25 + (Math.random() - 0.5),
            vy: dy * 0.15 - 1.2,
            size: 1 + Math.random() * 1.6,
            depth: 1,
            phase: Math.random() * 6,
          });
        }
      }

      // Нижний сугроб — только десктоп
      if (!isDesktop()) return;

      const col = Math.floor(pointerX / CELL);
      const brushRadius = 7;
      for (let c = col - brushRadius; c <= col + brushRadius; c++) {
        if (c < 0 || c >= floor.length) continue;
        const depth = floor[c]!;
        if (depth < 0.4) continue;
        const top = h - depth;
        if (pointerY < top - 28 || pointerY > h + 8) continue;

        const falloff = 1 - Math.abs(c - col) / (brushRadius + 0.01);
        const take = Math.min(
          depth,
          (0.55 + speed * 0.09) * falloff * falloff * dt,
        );
        if (take < 0.04) continue;
        floor[c]! -= take;

        const pushCol = Math.max(
          0,
          Math.min(floor.length - 1, c + Math.sign(dx || 1) * 2),
        );
        floor[pushCol] = Math.min(
          MAX_FLOOR_DEPTH,
          floor[pushCol]! + take * 0.25,
        );

        if (Math.random() < 0.55 + speed * 0.04) {
          flakes.push({
            x: c * CELL + CELL / 2 + (Math.random() - 0.5) * 4,
            y: top + (Math.random() - 0.3) * 6,
            vx: dx * 0.35 + (Math.random() - 0.5) * 1.8,
            vy: dy * 0.2 - 1.4 - Math.random() * 1.2,
            size: 1.1 + Math.random() * 1.8,
            depth: 1,
            phase: Math.random() * 6,
          });
        }
      }
    }

    function excavatorDrawSize() {
      const drawW = EXCAVATOR_W;
      const drawH =
        drawW *
        ((excavatorImg.naturalHeight || 1) / (excavatorImg.naturalWidth || 1));
      return { drawW, drawH };
    }

    /** Ковш впереди по ходу: в спрайте лицом влево ковш слева. */
    function excavatorBucketX() {
      const { drawW } = excavatorDrawSize();
      const faceLeft = excavator.dir < 0;
      return excavator.x + (faceLeft ? -1 : 1) * drawW * 0.36;
    }

    function sampleSnowUnderExcavator() {
      // Среднее по нескольким точкам — без скачков по колонкам пола.
      const offsets = [-18, -6, 6, 18];
      let sum = 0;
      for (const o of offsets) sum += floorHeightAt(excavator.x + o);
      return sum / offsets.length;
    }

    function updateExcavator(dt: number) {
      // На мобилке экскаватора нет.
      if (!isDesktop()) {
        excavator.active = false;
        return;
      }

      if (!excavator.active) {
        excavator.wait -= dt;
        if (excavator.wait <= 0) {
          excavator.active = true;
          excavator.dir = Math.random() > 0.5 ? 1 : -1;
          excavator.x = excavator.dir > 0 ? -70 : w + 70;
          excavator.pile = 0;
          excavator.snowSmooth = sampleSnowUnderExcavator();
        }
        return;
      }

      // Плавное движение без рывков
      excavator.x += excavator.dir * 1.05 * dt;
      const targetSnow = sampleSnowUnderExcavator();
      const follow = 1 - Math.pow(0.86, dt);
      excavator.snowSmooth += (targetSnow - excavator.snowSmooth) * follow;

      // Сгребаем снег у ковша, а не под колёсами.
      const bucketX = excavatorBucketX();
      const blade = Math.floor(bucketX / CELL);
      const pushTo = blade + excavator.dir * 8;
      for (let c = blade - 2; c <= blade + 1; c++) {
        if (c < 0 || c >= floor.length) continue;
        const take = Math.min(floor[c]!, 2.2 * dt);
        if (take < 0.01) continue;
        floor[c]! -= take;
        excavator.pile += take;
        const dest = Math.max(
          0,
          Math.min(floor.length - 1, pushTo + (c - blade)),
        );
        floor[dest] = Math.min(MAX_FLOOR_DEPTH, floor[dest]! + take * 0.9);
      }

      const heap = Math.max(
        0,
        Math.min(floor.length - 1, pushTo + excavator.dir * 2),
      );
      if (excavator.pile > 0.8) {
        const dump = Math.min(excavator.pile * 0.06 * dt, 1.6 * dt);
        floor[heap] = Math.min(MAX_FLOOR_DEPTH, floor[heap]! + dump);
        excavator.pile = Math.max(0, excavator.pile - dump);
      }

      const off =
        excavator.dir > 0 ? excavator.x > w + 70 : excavator.x < -70;
      if (off) {
        excavator.active = false;
        excavator.pile = 0;
        excavator.wait = 160 + Math.random() * 200;
      }
    }

    function drawExcavator() {
      if (!isDesktop() || !excavator.active || !excavatorReady) return;

      const { drawW, drawH } = excavatorDrawSize();
      // Колёса чуть утоплены в сугроб
      const y = h - excavator.snowSmooth + EXCAVATOR_SINK;
      const faceLeft = excavator.dir < 0;

      // Крыша кабины в спрайте лицом влево (ковш слева)
      const beaconX = -drawW * 0.06;
      const beaconY = -drawH * 0.64;

      ctx!.save();
      ctx!.translate(excavator.x, y);
      ctx!.scale(faceLeft ? 1 : -1, 1);

      // Луч мигалки
      ctx!.save();
      ctx!.translate(beaconX, beaconY);
      ctx!.rotate(time * 4.4);
      const beam = ctx!.createRadialGradient(0, 0, 1, 0, 0, 36);
      beam.addColorStop(0, "rgba(255, 150, 40, 0.55)");
      beam.addColorStop(0.4, "rgba(255, 120, 30, 0.2)");
      beam.addColorStop(1, "rgba(255, 100, 20, 0)");
      ctx!.fillStyle = beam;
      ctx!.beginPath();
      ctx!.moveTo(0, 0);
      ctx!.arc(0, 0, 36, -0.48, 0.48);
      ctx!.closePath();
      ctx!.fill();
      ctx!.restore();

      ctx!.drawImage(excavatorImg, -drawW / 2, -drawH, drawW, drawH);

      // Мигалка на кабине
      const pulse = 0.65 + 0.35 * Math.sin(time * 11);
      ctx!.fillStyle = `rgba(255, 130, 30, ${0.8 + pulse * 0.2})`;
      ctx!.beginPath();
      ctx!.ellipse(beaconX, beaconY, 4.2, 3.2, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = `rgba(255, 210, 90, ${0.5 + pulse * 0.45})`;
      ctx!.beginPath();
      ctx!.ellipse(beaconX, beaconY - 1, 2.2, 1.6, 0, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.restore();
    }

    function drawPile(surface: Surface) {
      if (surface.points.length === 0) return;
      sizeCapCanvas(surface);
      const c = surface.capCtx;
      const ch = CAP_PAD + 22;
      c.clearRect(0, 0, surface.width, ch);

      for (let i = 0; i < surface.heights.length; i++) {
        const d = surface.heights[i]!;
        if (d < 0.55) continue;
        const p = surface.points[i];
        if (!p) continue;
        const radiusX = CELL * 1.25 + d * 0.18;
        const radiusY = d * 0.95;
        const cx = p.x;
        // Локальные coords → canvas со сдвигом CAP_PAD
        const cy = p.y + CAP_PAD - d * 0.35;

        const grad = c.createRadialGradient(
          cx,
          cy - radiusY * 0.25,
          0.2,
          cx,
          cy,
          Math.max(radiusX, radiusY),
        );
        grad.addColorStop(0, "rgba(248, 251, 255, 0.88)");
        grad.addColorStop(0.55, "rgba(230, 238, 247, 0.5)");
        grad.addColorStop(1, "rgba(210, 222, 235, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
        c.fill();
      }
    }

    function drawFloor() {
      if (!isDesktop()) return;
      let any = false;
      for (let i = 0; i < floor.length; i++) {
        if (floor[i]! > 0.4) {
          any = true;
          break;
        }
      }
      if (!any) return;

      ctx!.beginPath();
      ctx!.moveTo(0, h);
      ctx!.lineTo(0, h - floor[0]!);
      for (let i = 1; i < floor.length; i++) {
        ctx!.lineTo(i * CELL + CELL / 2, h - floor[i]!);
      }
      ctx!.lineTo(w, h - floor[floor.length - 1]!);
      ctx!.lineTo(w, h);
      ctx!.closePath();
      ctx!.fillStyle = "rgba(244, 249, 253, 0.97)";
      ctx!.fill();

      const grad = ctx!.createLinearGradient(0, h - MAX_FLOOR_DEPTH, 0, h);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.4, "rgba(248, 252, 255, 0.98)");
      grad.addColorStop(0.75, "rgba(236, 244, 250, 0.95)");
      grad.addColorStop(1, "rgba(228, 238, 248, 0.9)");
      ctx!.fillStyle = grad;
      ctx!.fill();
    }

    function slideByTilt(dt: number) {
      if (Math.abs(tiltX) < 0.12 && shakeBoost < 0.2) return;
      const force = tiltX;
      if (Math.abs(force) > 0.5 || shakeBoost > 1.1) {
        for (const surface of surfaces) {
          if (surface.points.length === 0) continue;
          for (let i = 0; i < surface.heights.length; i++) {
            const amount = surface.heights[i]!;
            if (amount < 0.4) continue;
            const p = surface.points[i]!;
            spillFlake(
              flakes,
              viewX(surface, p.x),
              viewY(surface, p.y) - amount * 0.4,
              force * 2,
              amount,
            );
            surface.heights[i] = 0;
          }
        }
        return;
      }

      for (const surface of surfaces) {
        if (surface.points.length === 0) continue;
        const dir = force > 0 ? 1 : -1;
        if (dir > 0) {
          for (let i = surface.heights.length - 2; i >= 0; i--) {
            const move = surface.heights[i]! * Math.abs(force) * 0.1 * dt;
            if (move < 0.02) continue;
            surface.heights[i]! -= move;
            surface.heights[i + 1]! = Math.min(
              surface.maxDepth,
              surface.heights[i + 1]! + move * 0.65,
            );
          }
        } else {
          for (let i = 1; i < surface.heights.length; i++) {
            const move = surface.heights[i]! * Math.abs(force) * 0.1 * dt;
            if (move < 0.02) continue;
            surface.heights[i]! -= move;
            surface.heights[i - 1]! = Math.min(
              surface.maxDepth,
              surface.heights[i - 1]! + move * 0.65,
            );
          }
        }
        spillExcess(surface);
      }
    }

    function frame(ts: number) {
      if (!running) return;
      const dt = Math.min(2.5, (ts - lastTs) / 16.67);
      lastTs = ts;
      time += dt * 0.016;

      shakeBoost = Math.max(0, shakeBoost - dt * 0.045);
      wind = 0.12 + tiltX * 1.6 + Math.sin(time * 0.7) * 0.1;

      // Редко ищем новые элементы; origin — каждый кадр для hit-test.
      if (Math.random() < 0.03) rebuildSurfaces();
      syncSurfaceOrigins();

      brushSurfaces(dt);
      slideByTilt(dt);
      updateExcavator(dt);

      for (const surface of surfaces) {
        if (surface.points.length === 0) continue;
        relaxHeights(surface.heights, surface.maxDepth);
        spillExcess(surface);
      }
      if (isDesktop()) relaxHeights(floor, MAX_FLOOR_DEPTH);

      while (flakes.length < FLAKE_COUNT) flakes.push(makeFlake(w, h, true));
      if (flakes.length > FLAKE_COUNT * 1.4) {
        flakes.splice(FLAKE_COUNT, flakes.length - FLAKE_COUNT);
      }

      ctx!.clearRect(0, 0, w, h);

      const layers: Path2D[] = [new Path2D(), new Path2D(), new Path2D()];
      let write = 0;

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i]!;
        const sway = Math.sin(time * 1.4 + f.phase) * 0.35 * f.depth;
        const targetVx = wind * f.depth + sway + tiltX * 1.1 * f.depth;
        const fall =
          (0.7 + f.depth * 0.85) *
          (1 + Math.abs(tiltY) * 0.15 + shakeBoost * 0.2);
        f.vx += (targetVx - f.vx) * 0.08 * dt;
        f.vy += (fall - f.vy) * 0.06 * dt;
        const prevY = f.y;
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        let landed = false;
        if (f.vy > 0) {
          for (const surface of surfaces) {
            if (deposit(surface, f.x, f.y, f.size * 0.45)) {
              landed = true;
              break;
            }
            for (let s = 0; s < surface.points.length; s++) {
              const p = surface.points[s]!;
              const px = viewX(surface, p.x);
              const sy = viewY(surface, p.y) - surface.heights[s]!;
              if (
                Math.abs(f.x - px) <= CELL * 1.25 &&
                prevY <= sy &&
                f.y >= sy
              ) {
                surface.heights[s] = Math.min(
                  surface.maxDepth,
                  surface.heights[s]! + f.size * 0.5,
                );
                landed = true;
                break;
              }
            }
            if (landed) break;
          }

          if (!landed) {
            if (isDesktop()) {
              const col = Math.max(
                0,
                Math.min(floor.length - 1, Math.floor(f.x / CELL)),
              );
              const ground = h - floor[col]!;
              if (f.y >= ground && f.x >= 0 && f.x <= w) {
                floor[col] = Math.min(
                  MAX_FLOOR_DEPTH,
                  floor[col]! + f.size * FLOOR_CATCH,
                );
                if (col > 0) {
                  floor[col - 1] = Math.min(
                    MAX_FLOOR_DEPTH,
                    floor[col - 1]! + f.size * 0.22,
                  );
                }
                if (col < floor.length - 1) {
                  floor[col + 1] = Math.min(
                    MAX_FLOOR_DEPTH,
                    floor[col + 1]! + f.size * 0.22,
                  );
                }
                landed = true;
              }
            } else if (f.y >= h) {
              landed = true;
            }
          }
        }

        if (landed || f.y > h + 30 || f.x < -100 || f.x > w + 100) {
          Object.assign(f, makeFlake(w, h, true));
        }

        flakes[write++] = f;
        const layer = f.depth < 0.65 ? 0 : f.depth < 0.85 ? 1 : 2;
        layers[layer]!.moveTo(f.x + f.size, f.y);
        layers[layer]!.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      }
      flakes.length = write;

      // Экскаватор и пол на fixed-canvas; шапки — в DOM у элементов.
      drawExcavator();
      drawFloor();
      for (const surface of surfaces) drawPile(surface);

      const alphas = [0.35, 0.58, 0.82];
      for (let i = 0; i < 3; i++) {
        ctx!.globalAlpha = alphas[i]!;
        ctx!.fillStyle = "#f2f6fb";
        ctx!.fill(layers[i]!);
      }
      ctx!.globalAlpha = 1;

      lastPointerX = pointerX;
      lastPointerY = pointerY;
      raf = requestAnimationFrame(frame);
    }

    function hookMotion() {
      if (motionHooked) return;
      motionHooked = true;
      window.addEventListener("deviceorientation", onOrientation);
      window.addEventListener("devicemotion", onMotion);
    }

    async function requestMotionPermission() {
      type Permissioned = {
        requestPermission?: () => Promise<"granted" | "denied" | "default">;
      };
      const orientation = DeviceOrientationEvent as unknown as Permissioned;
      const motion = DeviceMotionEvent as unknown as Permissioned;
      try {
        if (typeof orientation.requestPermission === "function") {
          await orientation.requestPermission();
        }
        if (typeof motion.requestPermission === "function") {
          await motion.requestPermission();
        }
      } catch {
        // ignore
      }
      hookMotion();
    }

    function onPointer(e: PointerEvent) {
      pointerX = e.clientX;
      pointerY = e.clientY;
      pointerActive = true;
    }
    function onPointerLeave() {
      pointerActive = false;
    }
    function onFirstInteract() {
      void requestMotionPermission();
      window.removeEventListener("pointerdown", onFirstInteract);
    }
    function onOrientation(e: DeviceOrientationEvent) {
      tiltX = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 35));
      tiltY = Math.max(-1, Math.min(1, ((e.beta ?? 0) - 45) / 45));
    }
    function onMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const x = a.x ?? 0;
      const y = a.y ?? 0;
      const z = a.z ?? 0;
      const jerk = Math.hypot(x - lastAccel.x, y - lastAccel.y, z - lastAccel.z);
      lastAccel = { x, y, z };
      if (jerk > 14) {
        shakeBoost = Math.min(2.5, shakeBoost + jerk * 0.08);
        for (const surface of surfaces) {
          if (surface.points.length === 0) continue;
          for (let i = 0; i < surface.heights.length; i++) {
            const amount = surface.heights[i]!;
            if (amount < 0.3) continue;
            const p = surface.points[i]!;
            spillFlake(
              flakes,
              viewX(surface, p.x),
              viewY(surface, p.y),
              tiltX * 3,
              amount,
            );
            surface.heights[i] = 0;
          }
        }
      }
    }

    resize();
    raf = requestAnimationFrame(frame);
    hookMotion();

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    let syncRaf = 0;
    const scheduleSurfaces = () => {
      if (syncRaf) return;
      syncRaf = requestAnimationFrame(() => {
        syncRaf = 0;
        rebuildSurfaces();
      });
    };
    const onlyWinterCaps = (nodes: NodeList) => {
      for (const n of nodes) {
        if (!(n instanceof HTMLElement) || n.dataset.winterCap !== "1") {
          return false;
        }
      }
      return true;
    };
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (!onlyWinterCaps(m.addedNodes) || !onlyWinterCaps(m.removedNodes)) {
          scheduleSurfaces();
          return;
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    const mq = window.matchMedia("(min-width: 768px)");
    const onMqChange = () => {
      floorSeeded = false;
      resize();
      scheduleSurfaces();
    };
    mq.addEventListener("change", onMqChange);

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("pointerdown", onFirstInteract, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (syncRaf) cancelAnimationFrame(syncRaf);
      surfaces.forEach(disposeSurface);
      surfaces = [];
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener("change", onMqChange);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("pointerdown", onFirstInteract);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 45 }}
    />
  );
}
