"use client";

import { useEffect, useRef, useState } from "react";
import { parseResponseJson } from "@/lib/api-json";

type Challenge = {
  token: string;
};

export type CaptchaSolution = {
  token: string;
  proof: string;
};

const CUT_RATIO = 0.88;

function ScissorsIcon() {
  return (
    <svg viewBox="0 0 32 48" width="28" height="42" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="10" cy="10" r="6" />
        <circle cx="22" cy="10" r="6" />
        <path d="M14.2 14.8 8 44" />
        <path d="M17.8 14.8 24 44" />
        <path d="M16 16v6" />
      </g>
    </svg>
  );
}

export function TicketCaptcha({
  error,
  onSolved,
}: {
  error?: string;
  onSolved: (solution: CaptchaSolution | null) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const [retry, setRetry] = useState(0);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loadError, setLoadError] = useState("");
  const [cut, setCut] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<"idle" | "solving" | "ready">("idle");
  const completingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/captcha", { cache: "no-store" })
      .then(async (response) => {
        const data = await parseResponseJson<Challenge & { error?: string }>(response);
        if (cancelled) return;
        if (!response.ok || !data.token) {
          throw new Error(data.error ?? "captcha");
        }
        setChallenge({ token: data.token });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Не удалось загрузить капчу.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [retry]);

  async function complete(token: string) {
    if (completingRef.current) return;
    completingRef.current = true;
    cutRef.current = 1;
    setCut(1);
    setPhase("solving");
    try {
      const response = await fetch("/api/captcha", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await parseResponseJson<{ proof?: string; error?: string }>(response);
      if (!response.ok || !data.proof) {
        throw new Error(data.error ?? "captcha");
      }
      setPhase("ready");
      onSolved({ token, proof: data.proof });
    } catch {
      completingRef.current = false;
      setPhase("idle");
      cutRef.current = 0;
      setCut(0);
      setLoadError("Не удалось подтвердить капчу.");
      onSolved(null);
    }
  }

  function cutFromClientY(clientY: number) {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const next = (clientY - rect.top) / rect.height;
    return Math.min(1, Math.max(0, next));
  }

  function applyCut(next: number) {
    if (!challenge || phase !== "idle" || completingRef.current) return;
    cutRef.current = next;
    setCut(next);
    if (next >= CUT_RATIO) {
      void complete(challenge.token);
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (phase !== "idle" || !challenge) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    setDragging(true);
    applyCut(cutFromClientY(event.clientY));
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging || phase !== "idle") return;
    applyCut(cutFromClientY(event.clientY));
  }

  function onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    if (
      pointerIdRef.current !== null &&
      event.currentTarget.hasPointerCapture(pointerIdRef.current)
    ) {
      event.currentTarget.releasePointerCapture(pointerIdRef.current);
    }
    pointerIdRef.current = null;
    setDragging(false);
    if (phase !== "idle") return;
    if (cutRef.current < CUT_RATIO) {
      cutRef.current = 0;
      setCut(0);
    }
  }

  function reload() {
    completingRef.current = false;
    cutRef.current = 0;
    setChallenge(null);
    setCut(0);
    setDragging(false);
    setPhase("idle");
    setLoadError("");
    onSolved(null);
    setRetry((value) => value + 1);
  }

  const torn = phase !== "idle";
  const shownError = error || loadError;
  const hint =
    phase === "solving"
      ? "Отрезаем корешок…"
      : phase === "ready"
        ? "Корешок отрезан — можно отправлять"
        : "Проведите ножницы вниз по линии отрыва";

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Капча
        <span className="text-primary" aria-hidden="true">
          {" "}
          *
        </span>
      </p>
      <div
        className={`ticket-captcha ${torn ? "ticket-captcha-torn" : ""} ${
          shownError ? "ticket-captcha-invalid" : ""
        }`}
      >
        <div className="ticket-captcha-frame">
          <div className="ticket-captcha-body">
            <p className="ticket-captcha-kicker">Кинотеатр КАРО</p>
            <p className="ticket-captcha-title">Пригласительный</p>
            <p className="ticket-captcha-sub">Роскошный максимум</p>
            <div className="ticket-captcha-meta">
              <span>Ряд 7</span>
              <span>Место 12</span>
            </div>
          </div>
          <div ref={trackRef} className="ticket-captcha-cut">
            <div className="ticket-captcha-perf" aria-hidden="true" />
            <div
              className="ticket-captcha-cut-line"
              style={{ height: `${Math.max(8, cut * 100)}%` }}
            />
            <button
              type="button"
              disabled={phase !== "idle" || !challenge}
              aria-label="Провести ножницы по линии отрыва"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(cut * 100)}
              aria-orientation="vertical"
              role="slider"
              className="ticket-captcha-scissors"
              style={{
                top: `${cut * 100}%`,
                transition: dragging ? "none" : "top 220ms ease",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={(event) => {
                if (phase !== "idle" || !challenge) return;
                if (event.key === "ArrowDown" || event.key === "End") {
                  event.preventDefault();
                  applyCut(event.key === "End" ? 1 : Math.min(1, cut + 0.18));
                }
                if (event.key === "ArrowUp" || event.key === "Home") {
                  event.preventDefault();
                  applyCut(event.key === "Home" ? 0 : Math.max(0, cut - 0.18));
                }
              }}
            >
              <ScissorsIcon />
            </button>
          </div>
          <div className="ticket-captcha-stub">
            <span className="ticket-captcha-stub-label">Корешок</span>
            <span className="ticket-captcha-stub-brand">КАРО</span>
            <span className="ticket-captcha-stub-state">
              {torn ? "отрезан" : "отрезать"}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted">{hint}</p>
      {shownError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-primary" role="alert">
            {shownError}
          </p>
          <button
            type="button"
            className="text-sm font-semibold text-gold underline underline-offset-4"
            onClick={reload}
          >
            Обновить капчу
          </button>
        </div>
      ) : null}
    </div>
  );
}
