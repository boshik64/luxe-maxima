const PII_KEYS = /email|phone|tel|name|fio|patronymic|comment|message|company/i;

function maskValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    return `${local.slice(0, 1)}***@${domain}`;
  }
  if (/^\+?\d{10,15}$/.test(value.replace(/\s/g, ""))) {
    return `${value.slice(0, 4)}****${value.slice(-2)}`;
  }
  if (value.length <= 2) return "***";
  return `${value.slice(0, 1)}***`;
}

function sanitize(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(sanitize);
  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, value]) => [
        key,
        PII_KEYS.test(key) ? maskValue(value) : sanitize(value),
      ]),
    );
  }
  return input;
}

function serialize(extra: unknown): unknown {
  if (extra instanceof Error) {
    return {
      name: extra.name,
      message: extra.message,
      code: (extra as Error & { code?: string }).code,
    };
  }
  return sanitize(extra);
}

export const logger = {
  info(message: string, extra?: unknown) {
    console.info(message, extra ? serialize(extra) : "");
  },
  error(message: string, extra?: unknown) {
    console.error(message, extra ? serialize(extra) : "");
  },
};
