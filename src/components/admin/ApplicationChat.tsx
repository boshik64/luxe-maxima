"use client";

import { useEffect, useRef, useState } from "react";
import type { ApplicationRecord } from "@/lib/applications/types";
import { publicApplicationCode } from "@/lib/applications/dates";

export function ApplicationChat({
  item,
  onUpdated,
}: {
  item: ApplicationRecord;
  onUpdated: (item: ApplicationRecord) => void;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const messages = item.messages ?? [];
  const code = publicApplicationCode(item.publicNumber);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function send() {
    if (sending) return;
    setSending(true);
    setError("");
    const form = new FormData();
    form.set("body", body);
    for (const file of files) form.append("files", file);
    const response = await fetch(`/api/admin/applications/${item.id}/messages`, {
      method: "POST",
      body: form,
    });
    const data = (await response.json()) as {
      item?: ApplicationRecord;
      error?: string;
    };
    setSending(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось отправить");
      return;
    }
    setBody("");
    setFiles([]);
    if (data.item) onUpdated(data.item);
  }

  return (
    <div className="flex h-[min(32rem,70vh)] max-h-[70vh] flex-col overflow-hidden rounded-3xl border border-line bg-background/50 lg:sticky lg:top-4">
      <div className="shrink-0 border-b border-line px-4 py-3">
        <p className="text-sm font-semibold">Переписка с гостем</p>
        <p className="mt-1 text-xs text-muted">
          Письма уходят с почты Event. Тема {code} — гость не должен её менять.
          Подпись берётся из раздела «Мой профиль».
        </p>
      </div>
      <div ref={listRef} className="pretty-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            Напишите первое сообщение — заявка перейдёт в «Ждем ответа».
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.direction === "OUTBOUND";
            return (
              <div
                key={message.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "ml-auto bg-primary/20" : "mr-auto bg-card"
                }`}
              >
                <p className="text-[11px] text-muted">
                  {mine ? message.author?.name || "Менеджер" : item.contactName} ·{" "}
                  {new Date(message.createdAt).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                {message.attachments.length ? (
                  <ul className="mt-2 space-y-1">
                    {message.attachments.map((file) => (
                      <li key={file.id}>
                        <a
                          className="text-xs text-gold underline"
                          href={`/api/admin/applications/${item.id}/files/${file.id}`}
                        >
                          {file.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })
        )}
      </div>
      <div className="shrink-0 space-y-2 border-t border-line p-3">
        {error ? <p className="text-sm text-primary">{error}</p> : null}
        <textarea
          className="min-h-24 w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm outline-none"
          placeholder="Сообщение гостю…"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs text-muted">
            <input
              type="file"
              multiple
              className="mr-2 text-xs"
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
            />
            {files.length ? `${files.length} файл.` : "Вложения"}
          </label>
          <button
            type="button"
            disabled={sending}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => void send()}
          >
            {sending ? "Отправляем…" : "Отправить"}
          </button>
        </div>
      </div>
    </div>
  );
}
