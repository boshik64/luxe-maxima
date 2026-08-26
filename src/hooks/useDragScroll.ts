"use client";

import { useEffect, useRef } from "react";

const DRAG_THRESHOLD_PX = 10;

/** Горизонтальный скролл мышью. Клик по карточке работает; захват — только после сдвига. */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;

    function endDrag() {
      pointerId = null;
      dragging = false;
      el!.classList.remove("is-dragging");
    }

    function onDown(event: PointerEvent) {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = el!.scrollLeft;
      dragging = false;
    }

    function onMove(event: PointerEvent) {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;

      if (!dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
        dragging = true;
        el!.classList.add("is-dragging");
        try {
          el!.setPointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }

      el!.scrollLeft = startScroll - dx;
      event.preventDefault();
    }

    function onUp(event: PointerEvent) {
      if (pointerId !== event.pointerId) return;
      const wasDragging = dragging;
      if (dragging) {
        try {
          el!.releasePointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }
      endDrag();

      if (!wasDragging) return;
      const suppress = (click: Event) => {
        click.preventDefault();
        click.stopPropagation();
        el!.removeEventListener("click", suppress, true);
      };
      el!.addEventListener("click", suppress, true);
      window.setTimeout(() => el!.removeEventListener("click", suppress, true), 120);
    }

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return ref;
}
