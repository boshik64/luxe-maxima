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

const MIN_TEAR_DISTANCE = 64;

export function TicketCaptcha({
  error,
  onSolved,
}: {
  error?: string;
  onSolved: (solution: CaptchaSolution | null) => void;
}) {
  const startXRef = useRef(0);
  const offsetRef = useRef(0);
  const tearDistanceRef = useRef(MIN_TEAR_DISTANCE);
  const pointerIdRef = useRef<number | null>(null);
  const completingRef = useRef(false);
  const [retry, setRetry] = useState(0);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loadError, setLoadError] = useState("");
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<"idle" | "solving" | "ready">("idle");

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

  function resetStub() {
    offsetRef.current = 0;
    setOffset(0);
  }

  async function complete(token: string) {
    if (completingRef.current) return;
    completingRef.current = true;
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
      resetStub();
      setLoadError("Не удалось подтвердить капчу.");
      onSolved(null);
    }
  }

  function tearOff() {
    if (!challenge || phase !== "idle" || completingRef.current) return;
    void complete(challenge.token);
  }

  function dragTo(clientX: number) {
    if (phase !== "idle" || completingRef.current) return;
    const next = Math.max(0, clientX - startXRef.current);
    offsetRef.current = next;
    setOffset(next);
    if (next >= tearDistanceRef.current) {
      setDragging(false);
      tearOff();
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (phase !== "idle" || !challenge) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    tearDistanceRef.current = Math.max(
      MIN_TEAR_DISTANCE,
      event.currentTarget.getBoundingClientRect().width * 0.85,
    );
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    dragTo(event.clientX);
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
    if (phase === "idle" && offsetRef.current < tearDistanceRef.current) {
      resetStub();
    }
  }

  function reload() {
    completingRef.current = false;
    setChallenge(null);
    resetStub();
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
      ? "Отрываем корешок…"
      : phase === "ready"
        ? "Корешок оторван — можно отправлять"
        : "Потяните корешок вправо, чтобы оторвать";

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
          <div className="ticket-captcha-perf" aria-hidden="true" />
          <button
            type="button"
            disabled={torn || !challenge}
            aria-label="Оторвите корешок билета — потяните вправо"
            className="ticket-captcha-stub"
            style={{
              transform: torn ? undefined : `translateX(${offset}px)`,
              transition: dragging ? "none" : "transform 260ms ease",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={(event) => {
              if (torn || !challenge) return;
              if (
                event.key === "ArrowRight" ||
                event.key === "End" ||
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                tearOff();
              }
            }}
          >
            <span className="ticket-captcha-stub-label">Корешок</span>
            <span className="ticket-captcha-stub-brand">КАРО</span>
            <span className="ticket-captcha-stub-state">
              {torn ? "оторван" : "тяните"}
            </span>
          </button>
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
