import { prisma } from "@/lib/db";
import { CatalogError } from "@/lib/catalog/service";
import {
  CONTACT_MAILTO,
  CONTACT_MAILTO_ID,
  CONTACT_MAILTO_MAX_BODY,
  CONTACT_MAILTO_MAX_SUBJECT,
  type ContactMailtoContent,
} from "@/lib/contacts";

function mailtoClient() {
  const client = prisma as unknown as {
    contactMailto?: typeof prisma.contactMailto;
  };
  if (!client.contactMailto) {
    throw new CatalogError(
      "Сервер запущен со старой схемой БД. Перезапустите next dev.",
      500,
    );
  }
  return client as { contactMailto: NonNullable<typeof client.contactMailto> };
}

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function serialize(row: { subject: string; body: string }): ContactMailtoContent {
  return {
    subject: row.subject,
    body: row.body,
  };
}

export async function getContactMailto(): Promise<ContactMailtoContent> {
  try {
    const row = await mailtoClient().contactMailto.upsert({
      where: { id: CONTACT_MAILTO_ID },
      create: {
        id: CONTACT_MAILTO_ID,
        subject: CONTACT_MAILTO.subject,
        body: CONTACT_MAILTO.body,
      },
      update: {},
    });
    return serialize(row);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2021" || code === "P2022") {
      return { ...CONTACT_MAILTO };
    }
    throw error;
  }
}

export async function saveContactMailto(data: {
  subject?: string;
  body?: string;
}): Promise<ContactMailtoContent> {
  const current = await getContactMailto();
  const subject =
    data.subject !== undefined
      ? clip(data.subject, CONTACT_MAILTO_MAX_SUBJECT)
      : current.subject;
  const body =
    data.body !== undefined
      ? clip(data.body, CONTACT_MAILTO_MAX_BODY)
      : current.body;
  if (!subject) {
    throw new CatalogError("Укажите тему письма");
  }
  if (!body) {
    throw new CatalogError("Укажите текст письма");
  }
  const row = await mailtoClient().contactMailto.upsert({
    where: { id: CONTACT_MAILTO_ID },
    create: { id: CONTACT_MAILTO_ID, subject, body },
    update: { subject, body },
  });
  return serialize(row);
}
