import { promises as dns } from "node:dns";
import { domainToASCII } from "node:url";
import { logger } from "@/lib/logger";
import { emailFormatSchema } from "@/lib/validation/contact";
import { probeMailboxSmtp } from "@/lib/email/smtp-probe";

const CACHE_TTL_MS = 10 * 60 * 1000;
const DNS_TIMEOUT_MS = 3000;
const mxCache = new Map<string, { hosts: string[] | null; at: number }>();

const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.ru",
  "localhost",
  "invalid",
  "local",
]);

const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getnada.com",
  "discard.email",
  "throwawaymail.com",
  "fakeinbox.com",
  "moakt.com",
  "dropmail.me",
  "mailnesia.com",
  "guerrillamailblock.com",
  "grr.la",
  "tempail.com",
  "dispostable.com",
  "maildrop.cc",
]);

const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.ru": "gmail.com",
  "gmail.comm": "gmail.com",
  "yandex.ry": "yandex.ru",
  "yande.ru": "yandex.ru",
  "yandex.con": "yandex.ru",
  "ya.ry": "ya.ru",
  "mail.ri": "mail.ru",
  "mai.ru": "mail.ru",
  "mall.ru": "mail.ru",
  "mail.con": "mail.ru",
  "icloud.con": "icloud.com",
  "outlook.con": "outlook.com",
  "hotmail.con": "hotmail.com",
};

const SKIP_SMTP_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yandex.ru",
  "yandex.com",
  "ya.ru",
  "mail.ru",
  "bk.ru",
  "inbox.ru",
  "list.ru",
  "internet.ru",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "yahoo.com",
  "proton.me",
  "protonmail.com",
  "rambler.ru",
]);

const SKIP_SMTP_MX = [
  "google.com",
  "googlemail.com",
  "outlook.com",
  "protection.outlook.com",
  "yandex.net",
  "yandex.ru",
  "mail.ru",
  "yahoodns.net",
  "icloud.com",
  "protonmail.ch",
];

function looksLikeReservedTld(domain: string) {
  return (
    domain.endsWith(".test") ||
    domain.endsWith(".example") ||
    domain.endsWith(".invalid") ||
    domain.endsWith(".localhost") ||
    domain.endsWith(".local")
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function smtpIdentity() {
  let helo = "karofilm.ru";
  try {
    const host = new URL(process.env.APP_URL || "https://karofilm.ru").hostname;
    if (host && host !== "localhost" && !host.startsWith("127.")) helo = host;
  } catch {
    // оставляем karofilm.ru
  }
  const from = (process.env.SMTP_FROM || `noreply@${helo}`).replace(/[<>]/g, "");
  return { helo, from };
}

function shouldSkipSmtp(domain: string, hosts: string[]) {
  if (SKIP_SMTP_DOMAINS.has(domain)) return true;
  return hosts.some((host) =>
    SKIP_SMTP_MX.some((marker) => host.includes(marker)),
  );
}

export function isNullMx(exchange: string) {
  const host = exchange.replace(/\.$/, "").trim();
  return !host || host === ".";
}

async function lookupMxHosts(domain: string) {
  const cached = mxCache.get(domain);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.hosts;

  try {
    const mx = await withTimeout(dns.resolveMx(domain), DNS_TIMEOUT_MS, "dns-timeout");
    const hosts = mx
      .sort((a, b) => a.priority - b.priority)
      .map((item) => item.exchange.replace(/\.$/, ""))
      .filter((item) => !isNullMx(item));
    mxCache.set(domain, { hosts: hosts.length ? hosts : null, at: Date.now() });
    return hosts.length ? hosts : null;
  } catch {
    mxCache.set(domain, { hosts: null, at: Date.now() });
    return null;
  }
}

async function confirmMailbox(email: string, domain: string, hosts: string[]) {
  if (process.env.MAILBOX_SMTP === "0") return null;
  if (shouldSkipSmtp(domain, hosts)) return null;

  const { helo, from } = smtpIdentity();
  const host = hosts[0];
  if (!host) return null;
  const result = await Promise.race([
    probeMailboxSmtp(host, email, { helo, from, timeoutMs: 2000 }),
    new Promise<"unknown">((resolve) => {
      setTimeout(() => resolve("unknown"), 2500);
    }),
  ]);
  if (result === "missing") {
    logger.info("Mailbox rejected by SMTP", { domain, mx: host });
    return "Такого почтового ящика не существует";
  }
  return null;
}

export async function checkMailbox(email: string): Promise<string | null> {
  try {
    const parsed = emailFormatSchema.safeParse(email);
    if (!parsed.success) {
      return parsed.error.issues[0]?.message ?? "Укажите корректный email";
    }

    const normalized = parsed.data;
    const rawDomain = normalized.split("@")[1] ?? "";
    let domain = "";
    try {
      domain = domainToASCII(rawDomain).toLowerCase();
    } catch {
      return "Укажите корректный email";
    }
    if (!domain || domain.includes("..") || !domain.includes(".")) {
      return "Укажите корректный email";
    }
    if (BLOCKED_DOMAINS.has(rawDomain) || BLOCKED_DOMAINS.has(domain) || looksLikeReservedTld(rawDomain)) {
      return "Укажите существующий рабочий email";
    }

    const suggestion = DOMAIN_TYPOS[rawDomain] ?? DOMAIN_TYPOS[domain];
    if (suggestion) {
      return `Похоже на опечатку. Возможно, вы имели в виду ${suggestion}?`;
    }

    if (DISPOSABLE_DOMAINS.has(rawDomain) || DISPOSABLE_DOMAINS.has(domain)) {
      return "Укажите постоянный email, а не временный ящик";
    }

    const hosts = await lookupMxHosts(domain);
    if (!hosts?.length) {
      return "Такого почтового ящика не существует — у домена нет почтовых серверов";
    }

    return confirmMailbox(normalized, domain, hosts);
  } catch (error) {
    logger.error("Mailbox check failed", error);
    return null;
  }
}
