import type { Metadata } from "next";
import { FeedbackPage } from "@/components/feedback/FeedbackPage";

export const metadata: Metadata = {
  title: "Обратная связь — КАРО",
  description:
    "Контакты КАРО и форма обратной связи по аренде зала, групповым походам и мероприятиям.",
};

export default function Page() {
  return <FeedbackPage />;
}
