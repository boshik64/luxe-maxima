import net from "node:net";

const DEFAULT_TIMEOUT_MS = 4500;

export function classifySmtpRcpt(
  code: number,
  text: string,
): "exists" | "missing" | "unknown" {
  if (code === 250 || code === 251) return "exists";
  const body = text.toLowerCase();
  if (code === 551 || code === 553) return "missing";
  if (code === 550 || code === 552 || code === 554) {
    if (
      /\b5\.1\.[0-3]\b/.test(body) ||
      /user|mailbox|recipient|unknown|exist|no such|not found|unavailable|rejected|disabled/.test(
        body,
      )
    ) {
      return "missing";
    }
  }
  return "unknown";
}

function extractReply(buffer: string): {
  reply?: { code: number; text: string };
  rest: string;
} {
  const lines = buffer.split(/\r?\n/);
  const incomplete = lines.pop() ?? "";
  const chunk: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    chunk.push(line);
    const match = line.match(/^(\d{3})([ -])(.*)$/);
    if (match?.[2] === " ") {
      const leftover = lines.slice(i + 1);
      return {
        reply: { code: Number(match[1]), text: chunk.join("\n") },
        rest: leftover.length ? `${leftover.join("\n")}\n${incomplete}` : incomplete,
      };
    }
  }
  return {
    rest: chunk.length ? `${chunk.join("\n")}\n${incomplete}` : incomplete,
  };
}

export async function probeMailboxSmtp(
  host: string,
  email: string,
  options: { helo: string; from: string; timeoutMs?: number },
): Promise<"exists" | "missing" | "unknown"> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const mx = host.replace(/\.$/, "");

  return new Promise((resolve) => {
    let buffer = "";
    let done = false;
    const pending: Array<(reply: { code: number; text: string }) => void> = [];

    const socket = net.connect({ port: 25, host: mx });
    socket.setEncoding("utf8");
    socket.setTimeout(timeoutMs);

    const finish = (result: "exists" | "missing" | "unknown") => {
      if (done) return;
      done = true;
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    const waitReply = () =>
      new Promise<{ code: number; text: string }>((res) => {
        pending.push(res);
        flush();
      });

    const flush = () => {
      while (pending.length) {
        const parsed = extractReply(buffer);
        if (!parsed.reply) break;
        buffer = parsed.rest;
        pending.shift()?.(parsed.reply);
      }
    };

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      flush();
    });
    socket.on("timeout", () => finish("unknown"));
    socket.on("error", () => finish("unknown"));

    const send = (command: string) => {
      socket.write(`${command}\r\n`);
      return waitReply();
    };

    void (async () => {
      try {
        const greeting = await waitReply();
        if (greeting.code !== 220) return finish("unknown");

        const ehlo = await send(`EHLO ${options.helo}`);
        if (ehlo.code >= 400) {
          const helo = await send(`HELO ${options.helo}`);
          if (helo.code >= 400) return finish("unknown");
        }

        const mailFrom = await send(`MAIL FROM:<${options.from}>`);
        if (mailFrom.code >= 400) return finish("unknown");

        const rcpt = await send(`RCPT TO:<${email}>`);
        socket.write("QUIT\r\n");
        finish(classifySmtpRcpt(rcpt.code, rcpt.text));
      } catch {
        finish("unknown");
      }
    })();
  });
}
