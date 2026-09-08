import nodemailer from "nodemailer";
import type { Application, Feedback } from "@prisma/client";
import {
  listStaffNotifyEmails,
  type StaffNotifyKind,
} from "@/lib/admin/users";
import { logger } from "@/lib/logger";
import {
  applicationGuestEmail,
  applicationStaffEmail,
  feedbackGuestEmail,
  feedbackStaffEmail,
} from "@/lib/email/templates";

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim());
}

function transport() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD ?? "";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    // Port 587: plain connect, then STARTTLS (Encryption = TLS in mail panels).
    requireTLS: !secure && port === 587,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    auth: user ? { user, pass } : undefined,
  });
}

function fromAddress() {
  return (
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    undefined
  );
}

async function staffRecipients(kind: StaffNotifyKind) {
  return listStaffNotifyEmails(kind);
}

async function sendMail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  const mailer = transport();
  if (!mailer) {
    logger.info("Email skipped: SMTP is not configured (set SMTP_HOST)");
    return false;
  }
  const from = fromAddress();
  if (!from) {
    logger.info("Email skipped: set SMTP_FROM (or SMTP_USER)");
    return false;
  }
  const to = Array.isArray(options.to) ? options.to.filter(Boolean) : [options.to];
  if (!to.length) return false;

  await mailer.sendMail({
    from,
    to,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
  return true;
}

function applicationNotifyKind(
  productId: Application["productId"],
): StaffNotifyKind | null {
  if (productId === "keys") return "keys";
  if (productId === "event") return "event";
  return null;
}

export async function notifyNewFeedback(item: Feedback) {
  if (!smtpConfigured()) {
    logger.info("Feedback emails skipped: SMTP_HOST is empty");
  }
  const staff = await staffRecipients("feedback");
  const guest = feedbackGuestEmail(item);
  const forStaff = feedbackStaffEmail(item);

  try {
    if (item.email) {
      await sendMail({
        to: item.email,
        subject: guest.subject,
        text: guest.text,
        html: guest.html,
      });
    }
  } catch (error) {
    logger.error("Failed to send feedback guest email", error);
  }

  try {
    if (staff.length) {
      await sendMail({
        to: staff,
        replyTo: item.email,
        subject: forStaff.subject,
        text: forStaff.text,
        html: forStaff.html,
      });
    } else {
      logger.info("Staff feedback email skipped: no subscribers");
    }
  } catch (error) {
    logger.error("Failed to send feedback staff email", error);
  }
}

export async function notifyNewApplication(application: Application) {
  if (!smtpConfigured()) {
    logger.info("Application emails skipped: SMTP_HOST is empty");
  }
  const kind = applicationNotifyKind(application.productId);
  const staff = kind ? await staffRecipients(kind) : [];
  const guest = applicationGuestEmail(application);
  const forStaff = applicationStaffEmail(application);

  try {
    if (application.email) {
      await sendMail({
        to: application.email,
        subject: guest.subject,
        text: guest.text,
        html: guest.html,
      });
    }
  } catch (error) {
    logger.error("Failed to send application guest email", error);
  }

  try {
    if (staff.length) {
      await sendMail({
        to: staff,
        replyTo: application.email,
        subject: forStaff.subject,
        text: forStaff.text,
        html: forStaff.html,
      });
    } else {
      logger.info(
        kind
          ? `Staff application email skipped: no subscribers for ${kind}`
          : "Staff application email skipped: product has no staff routing",
      );
    }
  } catch (error) {
    logger.error("Failed to send application staff email", error);
  }
}
