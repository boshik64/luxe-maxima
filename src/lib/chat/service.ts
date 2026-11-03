import type { Application, ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyManagerNewGuestMessage, sendMail } from "@/lib/email";
import { escapeHtml, renderEmailDocument } from "@/lib/email/layout";
import { PRODUCTS } from "@/lib/products";
import { publicApplicationCode } from "@/lib/applications/dates";
import { logger } from "@/lib/logger";
import {
  asChatUpload,
  readChatAttachment,
  saveChatAttachment,
  saveChatBuffer,
  type ChatUpload,
} from "@/lib/chat/storage";

const KEEP_SUBJECT =
  "Не меняйте тему письма, чтобы продолжить диалог по этой заявке.";

function threadSubject(application: Application, topic: string) {
  return `[${publicApplicationCode(application.publicNumber)}] ${topic}. ${KEEP_SUBJECT}`;
}

function withSignature(body: string, signature: string) {
  const sign = signature.trim();
  if (!sign) return body.trim();
  return `${body.trim()}\n\n--\n${sign}`;
}

export function applicationInclude() {
  return {
    manager: { select: { id: true, name: true, email: true } },
    messages: {
      orderBy: { createdAt: "asc" as const },
      include: {
        author: { select: { id: true, name: true } },
        attachments: true,
      },
    },
  };
}

export async function sendGuestReply(options: {
  application: Application;
  authorId: string;
  authorName: string;
  signature: string;
  body: string;
  files: ChatUpload[];
}) {
  const text = options.body.trim();
  if (!text && options.files.length === 0) {
    throw Object.assign(new Error("Напишите сообщение или прикрепите файл"), {
      status: 400,
    });
  }

  const savedFiles = [];
  for (const file of options.files) {
    savedFiles.push(await saveChatAttachment(file, options.application.id));
  }

  const lastOutbound = await prisma.applicationMessage.findFirst({
    where: { applicationId: options.application.id, direction: "OUTBOUND" },
    orderBy: { createdAt: "desc" },
  });

  const fullText = withSignature(text || "(вложение)", options.signature);
  const title = PRODUCTS[options.application.productId]?.title ?? "Заявка";
  const code = publicApplicationCode(options.application.publicNumber);
  const subject = threadSubject(options.application, title);
  const html = renderEmailDocument({
    title: `Ответ по заявке ${code}`,
    preheader: fullText.slice(0, 120),
    heading: `Заявка ${code}`,
    introHtml: `<p style="margin:0 0 10px;">Здравствуйте, ${escapeHtml(options.application.contactName)}!</p>
      <p style="margin:0; white-space:pre-wrap;">${escapeHtml(fullText)}</p>
      <p style="margin:16px 0 0; font-size:12px; color:#9f968a;">${escapeHtml(KEEP_SUBJECT)}</p>`,
    bodyHtml: "",
    footerNote: `Менеджер: ${options.authorName}`,
  });

  const attachments = [];
  for (const file of savedFiles) {
    const content = await readChatAttachment(file.storageKey);
    if (content) {
      attachments.push({
        filename: file.fileName,
        content,
        contentType: file.mimeType,
      });
    }
  }

  const sent = await sendMail({
    to: options.application.email,
    subject,
    text: `${fullText}\n\n${KEEP_SUBJECT}`,
    html,
    inReplyTo: lastOutbound?.emailMessageId ?? undefined,
    references: lastOutbound?.emailMessageId ? [lastOutbound.emailMessageId] : undefined,
    attachments,
  });

  const message = await prisma.applicationMessage.create({
    data: {
      applicationId: options.application.id,
      direction: "OUTBOUND",
      authorId: options.authorId,
      body: fullText,
      html,
      emailSubject: subject,
      emailMessageId: sent.messageId || null,
      inReplyTo: lastOutbound?.emailMessageId ?? null,
      attachments: {
        create: savedFiles,
      },
    },
    include: { attachments: true, author: { select: { id: true, name: true } } },
  });

  const nextStatus: ApplicationStatus =
    options.application.status === "NEW" ||
    options.application.status === "ANSWERED"
      ? "WAITING_REPLY"
      : options.application.status;

  const updated = await prisma.application.update({
    where: { id: options.application.id },
    data: {
      status: nextStatus,
      managerId: options.application.managerId ?? options.authorId,
    },
    include: applicationInclude(),
  });

  return { message, item: updated };
}

export async function ingestInboundMessage(options: {
  publicNumber?: number | null;
  inReplyTo?: string | null;
  messageId?: string | null;
  fromEmail?: string;
  subject?: string;
  text: string;
  html?: string;
  files?: Array<{ fileName: string; mimeType: string; bytes: Buffer }>;
}) {
  if (options.messageId) {
    const existing = await prisma.applicationMessage.findFirst({
      where: { emailMessageId: options.messageId },
    });
    if (existing) return existing;
  }

  let application = null as Awaited<ReturnType<typeof prisma.application.findFirst>>;
  if (options.inReplyTo) {
    const parent = await prisma.applicationMessage.findFirst({
      where: { emailMessageId: options.inReplyTo },
      include: { application: true },
    });
    application = parent?.application ?? null;
  }
  if (!application && options.publicNumber) {
    application = await prisma.application.findUnique({
      where: { publicNumber: options.publicNumber },
    });
  }
  if (!application && options.fromEmail) {
    const email = options.fromEmail.trim().toLowerCase();
    application = await prisma.application.findFirst({
      where: { email },
      orderBy: { updatedAt: "desc" },
    });
  }
  if (!application) {
    logger.info("Inbound email not matched to application", {
      subject: options.subject,
    });
    return null;
  }

  const savedFiles = [];
  for (const file of options.files ?? []) {
    const stored = await saveChatBuffer({
      applicationId: application.id,
      fileName: file.fileName,
      mimeType: file.mimeType,
      bytes: file.bytes,
    });
    if (stored) savedFiles.push(stored);
  }

  const message = await prisma.applicationMessage.create({
    data: {
      applicationId: application.id,
      direction: "INBOUND",
      body: options.text.trim() || "(вложение)",
      html: options.html ?? "",
      emailSubject: options.subject ?? "",
      emailMessageId: options.messageId ?? null,
      inReplyTo: options.inReplyTo ?? null,
      attachments: { create: savedFiles },
    },
  });

  const next = await prisma.application.update({
    where: { id: application.id },
    data: { status: "ANSWERED" },
    include: { manager: true },
  });

  if (next.manager?.email) {
    await notifyManagerNewGuestMessage({
      to: next.manager.email,
      applicationId: next.id,
      publicNumber: next.publicNumber,
      guestName: next.contactName,
      preview: message.body.slice(0, 280),
    });
  }

  return message;
}

export { asChatUpload };
