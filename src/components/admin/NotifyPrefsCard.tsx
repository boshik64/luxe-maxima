"use client";

import { useCallback, useEffect, useState } from "react";

type Prefs = {
  notifyKeys: boolean;
  notifyEvent: boolean;
  notifyFeedback: boolean;
};

const EMPTY: Prefs = {
  notifyKeys: false,
  notifyEvent: false,
  notifyFeedback: false,
};

/** Собственные настройки писем текущего пользователя. */
export function NotifyPrefsCard() {
  const [prefs, setPrefs] = useState<Prefs>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    return fetch("/api/admin/me").then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json()) as Prefs;
      setPrefs({
        notifyKeys: data.notifyKeys === true,
        notifyEvent: data.notifyEvent === true,
        notifyFeedback: data.notifyFeedback === true,
      });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить настройки писем");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function save(next: Prefs) {
    setPrefs(next);
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) {
        setError("Не удалось сохранить");
        return;
      }
      setNotice("Сохранено");
    } catch {
      setError("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-card px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Мои уведомления</h2>
          <p className="text-xs text-muted">Письма на ваш email</p>
        </div>
        {error ? <p className="text-xs text-primary">{error}</p> : null}
        {notice ? <p className="text-xs text-gold">{notice}</p> : null}
      </div>
      {loading ? (
        <p className="mt-2 text-xs text-muted">Загрузка…</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["notifyKeys", "Ключи от зала", prefs.notifyKeys],
              ["notifyEvent", "Мероприятие в КАРО", prefs.notifyEvent],
              ["notifyFeedback", "Обратная связь", prefs.notifyFeedback],
            ] as const
          ).map(([key, label, checked]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-background/40 px-3 py-1.5 text-xs sm:text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={saving}
                onChange={(event) =>
                  void save({ ...prefs, [key]: event.target.checked })
                }
                className="h-3.5 w-3.5 accent-[var(--primary)]"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
