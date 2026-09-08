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

function transport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });
}

function fromAddress() {
  return process.env.SMTP_FROM ?? process.env.SMTP_USER;
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
    logger.info("Email skipped: SMTP is not configured");
    return false;
  }
  const to = Array.isArray(options.to) ? options.to.filter(Boolean) : [options.to];
  if (!to.length) return false;

  await mailer.sendMail({
    from: fromAddress(),
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
