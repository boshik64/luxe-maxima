import type { Metadata } from "next";
import { FeedbackPage } from "@/components/feedback/FeedbackPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Контакты — КАРО",
  description: "Контакты КАРО по аренде зала и мероприятиям.",
};

export default function Page() {
  return <FeedbackPage />;
}
