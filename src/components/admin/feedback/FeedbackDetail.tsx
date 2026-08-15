"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Feedback, FeedbackStatus } from "@prisma/client";
import { AdminPage } from "@/components/admin/AdminPage";
import { CatalogBack } from "@/components/admin/catalog/CatalogShell";
import { Field, inputClassName } from "@/components/form/Field";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { FEEDBACK_STATUS_LABEL } from "@/lib/feedback/status";

export function FeedbackDetail({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    return fetch(`/api/admin/feedback/${id}`).then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await response.json()) as { item?: Feedback; error?: string };
      if (!response.ok || !data.item) {
        setError(data.error ?? "Не найдено");
        return;
      }
      setItem(data.item);
    });
  }, [id, router]);

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setError("Не удалось загрузить обращение");
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function save(patch: Partial<Pick<Feedback, "status" | "adminComment">>) {
    setSaving(true);
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await response.json()) as { item?: Feedback; error?: string };
    setSaving(false);
    if (!response.ok || !data.item) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    setItem(data.item);
    setNotice("Сохранено");
  }

  if (!item) {
    return (
      <AdminPage title="Обращение">
        <CatalogBack href="/admin/feedback" label="← К входящим" />
        <p className="text-sm text-muted">{error || "Загрузка…"}</p>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title={item.name}
      description={new Date(item.createdAt).toLocaleString("ru-RU")}
    >
      <CatalogBack href="/admin/feedback" label="← К входящим" />
      <div className="grid max-w-3xl gap-6">
        <section className="rounded-3xl border border-line bg-card p-6 sm:p-8">
          <p className="text-xs tracking-[0.2em] text-gold uppercase">Отправитель</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Email</dt>
              <dd>
                <a className="text-gold underline-offset-4 hover:underline" href={`mailto:${item.email}`}>
                  {item.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Телефон</dt>
              <dd>{item.phone || "—"}</dd>
            </div>
          </dl>
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed">
            {item.message}
          </p>
        </section>
        <section className="grid gap-5 rounded-3xl border border-line bg-card p-6 sm:p-8">
          <Field id="fb-status" label="Статус">
            <CustomSelect
              id="fb-status"
              value={item.status}
              options={Object.entries(FEEDBACK_STATUS_LABEL).map(
                ([value, label]) => ({ value, label }),
              )}
              onChange={(value) =>
                void save({ status: value as FeedbackStatus })
              }
            />
          </Field>
          <Field id="fb-admin" label="Внутренний комментарий">
            <textarea
              id="fb-admin"
              className={`${inputClassName} min-h-28`}
              defaultValue={item.adminComment ?? ""}
              onBlur={(event) => {
                if (event.target.value !== (item.adminComment ?? "")) {
                  void save({ adminComment: event.target.value });
                }
              }}
            />
          </Field>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          {notice || saving ? (
            <p className="text-sm text-gold">
              {saving ? "Сохраняем…" : notice}
            </p>
          ) : null}
        </section>
      </div>
    </AdminPage>
  );
}
