import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TTL_MS = 10 * 60 * 1000;
const DEFAULT_DIFFICULTY = 4;
const used = new Map<string, number>();

type Payload = {
  id: string;
  iat: number;
  exp: number;
  d: number;
};

function secret() {
  return process.env.AUTH_SECRET ?? process.env.ADMIN_PASSWORD ?? "dev-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function prune(now = Date.now()) {
  for (const [id, exp] of used) {
    if (exp < now) used.delete(id);
  }
}

function parseToken(token: string): Payload | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Payload;
  } catch {
    return null;
  }
}

export function proofPrefix(difficulty: number) {
  return "0".repeat(Math.max(1, Math.min(6, difficulty)));
}

export function hashCaptchaProof(token: string, proof: string) {
  return createHash("sha256").update(`${token}:${proof}`).digest("hex");
}

export function solveCaptchaProof(token: string, difficulty: number) {
  const prefix = proofPrefix(difficulty);
  for (let nonce = 0; nonce < 8_000_000; nonce += 1) {
    if (hashCaptchaProof(token, String(nonce)).startsWith(prefix)) {
      return String(nonce);
    }
  }
  throw new Error("captcha-pow");
}

export function solveIssuedCaptcha(token: string) {
  const payload = parseToken(token);
  if (!payload || payload.exp < Date.now()) return null;
  try {
    return solveCaptchaProof(token, payload.d);
  } catch {
    return null;
  }
}

export function issueCaptcha(difficulty = DEFAULT_DIFFICULTY) {
  prune();
  const now = Date.now();
  const payload: Payload = {
    id: randomBytes(16).toString("hex"),
    iat: now,
    exp: now + TTL_MS,
    d: difficulty,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return {
    token: `${encoded}.${sign(encoded)}`,
    difficulty: payload.d,
    expiresAt: payload.exp,
  };
}

export function captchaFromBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return { token: undefined, proof: undefined };
  }
  const data = body as { captchaToken?: unknown; captchaProof?: unknown };
  return {
    token: typeof data.captchaToken === "string" ? data.captchaToken : undefined,
    proof: typeof data.captchaProof === "string" ? data.captchaProof : undefined,
  };
}

export function verifyCaptcha(token: string | undefined, proof: string | undefined) {
  prune();
  if (!token?.trim() || !proof?.trim()) {
    return { ok: false as const, message: "Оторвите корешок билета, чтобы отправить форму" };
  }

  const payload = parseToken(token);
  if (!payload) {
    return { ok: false as const, message: "Капча устарела. Оторвите корешок ещё раз." };
  }
  if (payload.exp < Date.now()) {
    return { ok: false as const, message: "Капча устарела. Оторвите корешок ещё раз." };
  }
  if (used.has(payload.id)) {
    return { ok: false as const, message: "Капча уже использована. Оторвите корешок ещё раз." };
  }
  if (!hashCaptchaProof(token, proof).startsWith(proofPrefix(payload.d))) {
    return { ok: false as const, message: "Капча не пройдена. Оторвите корешок ещё раз." };
  }

  used.set(payload.id, payload.exp);
  return { ok: true as const };
}
