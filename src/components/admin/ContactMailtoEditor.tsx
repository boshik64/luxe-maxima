"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClassName } from "@/components/form/Field";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  CONTACT_MAILTO_MAX_BODY,
  CONTACT_MAILTO_MAX_SUBJECT,
  type ContactMailtoContent,
} from "@/lib/contacts";

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <p className="text-xs text-muted">
      {value.length} / {max}
    </p>
  );
}

export function ContactMailtoEditor() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    return fetch("/api/admin/contact-mailto").then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (response.status === 403) {
        router.push("/admin");
        return;
      }
      const data = (await response.json()) as {
        item?: ContactMailtoContent;
        error?: string;
      };
      if (!response.ok || !data.item) {
        setError(data.error ?? "Не удалось загрузить шаблон");
        return;
      }
      setSubject(data.item.subject);
      setBody(data.item.body);
      setError("");
    });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить шаблон");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/contact-mailto", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const data = (await response.json()) as {
      item?: ContactMailtoContent;
      error?: string;
    };
    setSaving(false);
    if (response.status === 403) {
      router.push("/admin");
      return;
    }
    if (!response.ok || !data.item) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    setSubject(data.item.subject);
    setBody(data.item.body);
    setNotice("Сохранено — шаблон на странице «Контакты» обновлён");
  }

  if (loading) {
    return <p className="text-sm text-muted">Загрузка…</p>;
  }

  return (
    <AdminPage
      title="Шаблон письма"
      description="Тема и текст, которые подставляются в почтовый клиент при клике на email на странице «Контакты»."
    >
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="max-w-2xl space-y-6 rounded-3xl border border-line bg-card p-6"
      >
        <Field id="mailto-subject" label="Тема письма" required>
          <input
            id="mailto-subject"
            className={inputClassName}
            maxLength={CONTACT_MAILTO_MAX_SUBJECT}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
          <CharCount value={subject} max={CONTACT_MAILTO_MAX_SUBJECT} />
        </Field>
        <Field id="mailto-body" label="Текст письма" required>
          <textarea
            id="mailto-body"
            className={`${inputClassName} min-h-64 resize-y whitespace-pre-wrap`}
            maxLength={CONTACT_MAILTO_MAX_BODY}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <CharCount value={body} max={CONTACT_MAILTO_MAX_BODY} />
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-primary">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="text-sm text-gold">
            {notice}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Сохраняем…" : "Сохранить"}
        </button>
      </form>
    </AdminPage>
  );
}
