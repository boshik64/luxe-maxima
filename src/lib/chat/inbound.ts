import { simpleParser } from "mailparser";
import { ImapFlow } from "imapflow";
import { parsePublicNumber } from "@/lib/applications/dates";
import { extractLatestReplyFromParts } from "@/lib/chat/extract-reply";
import {
  ewsConfigured,
  findUnreadInboxItems,
  getItemMime,
  markItemRead,
} from "@/lib/chat/ews";
import { ingestInboundMessage } from "@/lib/chat/service";
import { logger } from "@/lib/logger";

function imapConfigured() {
  return Boolean(
    process.env.IMAP_HOST?.trim() &&
      (process.env.IMAP_USER?.trim() || process.env.SMTP_USER?.trim()),
  );
}

function eventMailboxAddress() {
  const rawMailbox =
    process.env.SMTP_FROM ||
    process.env.EWS_USER ||
    process.env.IMAP_USER ||
    process.env.SMTP_USER ||
    "";
  const angle = rawMailbox.match(/<([^>]+)>/);
  return (angle?.[1] ?? rawMailbox).trim().toLowerCase();
}

async function ingestParsedMime(source: Buffer) {
  const parsed = await simpleParser(source);
  const from = parsed.from?.value[0]?.address ?? "";
  const eventMailbox = eventMailboxAddress();
  if (from && eventMailbox && from.toLowerCase() === eventMailbox) {
    return { imported: false, skipOwn: true as const };
  }

  const inReplyTo =
    typeof parsed.inReplyTo === "string"
      ? parsed.inReplyTo.replace(/[<>]/g, "")
      : "";
  const messageId =
    typeof parsed.messageId === "string"
      ? parsed.messageId.replace(/[<>]/g, "")
      : "";
  const subject = parsed.subject ?? "";
  const files = [];
  for (const attachment of parsed.attachments ?? []) {
    if (!attachment.content || attachment.content.length === 0) continue;
    files.push({
      fileName: attachment.filename || "attachment",
      mimeType: attachment.contentType || "application/octet-stream",
      bytes: Buffer.isBuffer(attachment.content)
        ? attachment.content
        : Buffer.from(attachment.content),
    });
  }

  const text = extractLatestReplyFromParts({
    text: parsed.text,
    html: typeof parsed.html === "string" ? parsed.html : null,
  });

  await ingestInboundMessage({
    publicNumber: parsePublicNumber(`${subject} ${parsed.text ?? ""}`),
    inReplyTo: inReplyTo || null,
    messageId: messageId || null,
    fromEmail: from,
    subject,
    text,
    html: "",
    files,
  });
  return { imported: true, skipOwn: false as const };
}

async function pollViaEws() {
  let imported = 0;
  const items = await findUnreadInboxItems(25);
  for (const item of items) {
    try {
      const mime = await getItemMime(item);
      if (!mime) {
        await markItemRead(item);
        continue;
      }
      const result = await ingestParsedMime(mime);
      if (result.imported) imported += 1;
      await markItemRead(item);
    } catch (error) {
      logger.error("EWS item processing failed", error);
    }
  }
  return { imported, skipped: false as const };
}

async function pollViaImap() {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST!.trim(),
    port: Number(process.env.IMAP_PORT ?? 993),
    secure: process.env.IMAP_SECURE !== "false",
    auth: {
      user: (process.env.IMAP_USER || process.env.SMTP_USER || "").trim(),
      pass: process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD || "",
    },
    logger: false,
  });

  let imported = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const message of client.fetch(
        { seen: false },
        { source: true, envelope: true },
      )) {
        if (!message.source) continue;
        const result = await ingestParsedMime(Buffer.from(message.source));
        if (result.imported) imported += 1;
        if (typeof message.uid === "number") {
          await client.messageFlagsAdd(message.uid, ["\\Seen"], { uid: true });
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore
    }
  }
  return { imported, skipped: false as const };
}

export async function pollInboundMailbox() {
  if (ewsConfigured()) {
    try {
      return await pollViaEws();
    } catch (error) {
      logger.error("EWS poll failed", error);
      return { imported: 0, skipped: false, error: "ews_failed" as const };
    }
  }

  if (!imapConfigured()) return { imported: 0, skipped: true as const };

  try {
    return await pollViaImap();
  } catch (error) {
    logger.error("IMAP poll failed", error);
    return { imported: 0, skipped: false, error: "imap_failed" as const };
  }
}
