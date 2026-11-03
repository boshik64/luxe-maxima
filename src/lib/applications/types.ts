import type { Application, ApplicationAttachment, ApplicationMessage } from "@prisma/client";

export type ApplicationManager = {
  id: string;
  name: string;
  email: string;
};

export type ApplicationChatMessage = ApplicationMessage & {
  author?: { id: string; name: string } | null;
  attachments: ApplicationAttachment[];
};

export type ApplicationRecord = Application & {
  manager?: ApplicationManager | null;
  messages?: ApplicationChatMessage[];
};
