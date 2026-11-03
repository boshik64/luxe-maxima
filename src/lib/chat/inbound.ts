import { simpleParser } from "mailparser";
import { ImapFlow } from "imapflow";
import { parsePublicNumber } from "@/lib/applications/dates";
import { ingestInboundMessage } from "@/lib/chat/service";
import { logger } from "@/lib/logger";

function imapConfigured() {
  return Boolean(
    process.env.IMAP_HOST?.trim() &&
      (process.env.IMAP_USER?.trim() || process.env.SMTP_USER?.trim()),
  );
}

export async function pollInboundMailbox() {
  if (!imapConfigured()) return { imported: 0, skipped: true };

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
      for await (const message of client.fetch({ seen: false }, { source: true, envelope: true })) {
        if (!message.source) continue;
        const parsed = await simpleParser(message.source);
        const from = parsed.from?.value[0]?.address ?? "";
        const rawMailbox =
          process.env.SMTP_FROM ||
          process.env.IMAP_USER ||
          process.env.SMTP_USER ||
          "";
        const angle = rawMailbox.match(/<([^>]+)>/);
        const eventMailbox = (angle?.[1] ?? rawMailbox).trim().toLowerCase();
        if (from && eventMailbox && from.toLowerCase() === eventMailbox) {
          if (typeof message.uid === "number") {
            await client.messageFlagsAdd(message.uid, ["\\Seen"], { uid: true });
          }
          continue;
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
        await ingestInboundMessage({
          publicNumber: parsePublicNumber(`${subject} ${parsed.text ?? ""}`),
          inReplyTo: inReplyTo || null,
          messageId: messageId || null,
          fromEmail: from,
          subject,
          text:
            parsed.text?.trim() ||
            (typeof parsed.html === "string"
              ? parsed.html.replace(/<[^>]+>/g, " ")
              : "") ||
            "",
          html: typeof parsed.html === "string" ? parsed.html : "",
          files,
        });
        imported += 1;
        if (typeof message.uid === "number") {
          await client.messageFlagsAdd(message.uid, ["\\Seen"], { uid: true });
        }
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    logger.error("IMAP poll failed", error);
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore
    }
  }
  return { imported, skipped: false };
}
