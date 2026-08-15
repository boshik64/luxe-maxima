"use client";

import { useEffect, useRef, useState } from "react";

type Challenge = {
  token: string;
  difficulty: number;
};

export type CaptchaSolution = {
  token: string;
  proof: string;
};

const TEAR_PX = 92;

function proofPrefix(difficulty: number) {
  return "0".repeat(Math.max(1, Math.min(6, difficulty)));
}

async function sha256Hex(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function solveProof(token: string, difficulty: number) {
  const prefix = proofPrefix(difficulty);
  for (let nonce = 0; nonce < 8_000_000; nonce += 1) {
    const hex = await sha256Hex(`${token}:${nonce}`);
    if (hex.startsWith(prefix)) return String(nonce);
    if (nonce % 250 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("captcha-pow");
}

export function TicketCaptcha({
  error,
  onSolved,
}: {
  error?: string;
  onSolved: (solution: CaptchaSolution | null) => void;
}) {
  const stubRef = useRef<HTMLButtonElement>(null);
  const startX = useRef(0);
  const offsetRef = useRef(0);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loadError, setLoadError] = useState("");
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<"idle" | "solving" | "ready">("idle");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/captcha")
      .then(async (response) => {
        const data = (await response.json()) as Challenge & { error?: string };
        if (cancelled) return;
        if (!response.ok || !data.token) {
          throw new Error(data.error ?? "captcha");
        }
        setChallenge({ token: data.token, difficulty: data.difficulty });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Не удалось загрузить капчу. Обновите страницу.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function complete(token: string, difficulty: number) {
    offsetRef.current = TEAR_PX + 24;
    setOffset(TEAR_PX + 24);
    setPhase("solving");
    try {
      const proof = await solveProof(token, difficulty);
      setPhase("ready");
      onSolved({ token, proof });
    } catch {
      setPhase("idle");
      offsetRef.current = 0;
      setOffset(0);
      setLoadError("Не удалось подтвердить капчу. Попробуйте ещё раз.");
      onSolved(null);
    }
  }

  function tearIfNeeded(nextOffset: number) {
    if (!challenge || phase !== "idle") return;
    if (nextOffset >= TEAR_PX) {
      void complete(challenge.token, challenge.difficulty);
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (phase !== "idle" || !challenge) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startX.current = event.clientX - offset;
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging || phase !== "idle") return;
    const next = Math.min(TEAR_PX + 40, Math.max(0, event.clientX - startX.current));
    offsetRef.current = next;
    setOffset(next);
    tearIfNeeded(next);
  }

  function onPointerUp() {
    setDragging(false);
    if (phase !== "idle") return;
    if (offsetRef.current < TEAR_PX) {
      offsetRef.current = 0;
      setOffset(0);
    }
  }

  const progress = Math.min(1, offset / TEAR_PX);
  const torn = phase !== "idle";
  const shownError = error || loadError;
  const hint =
    phase === "solving"
      ? "Гасим билет…"
      : phase === "ready"
        ? "Корешок оторван — можно отправлять"
        : "Потяните корешок вправо, как в кинотеатре";

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
        <div className="ticket-captcha-body">
          <p className="font-[family-name:var(--font-display)] text-[10px] tracking-[0.28em] text-[#9a2a2a] uppercase">
            Кинотеатр КАРО
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-lg leading-tight font-semibold text-[#1c1710]">
            Пригласительный
          </p>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-[#6b5c45] uppercase">
            Роскошный максимум
          </p>
          <p className="mt-3 text-xs text-[#7a6a52]">{hint}</p>
        </div>
        <div className="ticket-captcha-perf" aria-hidden="true" />
        <button
          ref={stubRef}
          type="button"
          disabled={phase !== "idle" || !challenge}
          aria-label="Оторвать корешок билета"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          role="slider"
          className="ticket-captcha-stub"
          style={{
            transform: `translate(${offset}px, ${progress * 10}px) rotate(${progress * 11}deg)`,
            transition: dragging ? "none" : "transform 280ms ease",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(event) => {
            if (phase !== "idle" || !challenge) return;
            if (event.key === "ArrowRight" || event.key === "End") {
              event.preventDefault();
              const next = event.key === "End" ? TEAR_PX : Math.min(TEAR_PX, offset + 18);
              offsetRef.current = next;
              setOffset(next);
              tearIfNeeded(next);
            }
            if (event.key === "ArrowLeft" || event.key === "Home") {
              event.preventDefault();
              const next = event.key === "Home" ? 0 : Math.max(0, offset - 18);
              offsetRef.current = next;
              setOffset(next);
            }
          }}
        >
          <span className="ticket-captcha-stub-label">Корешок</span>
          <span className="mt-1 font-[family-name:var(--font-display)] text-sm tracking-[0.18em] text-[#9a2a2a] uppercase">
            {phase === "ready" ? "КАРО" : "КАРО"}
          </span>
          <span className="mt-2 text-[10px] tracking-[0.16em] text-[#7a6a52] uppercase">
            {torn ? "оторван" : "оторвать →"}
          </span>
        </button>
      </div>
      <p className="text-xs text-muted">
        Защита от ботов: оторвите корешок у билета. Можно стрелкой вправо.
      </p>
      {shownError ? (
        <p className="text-sm text-primary" role="alert">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
