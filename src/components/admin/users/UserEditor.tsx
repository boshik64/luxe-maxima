"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import { CatalogBack } from "@/components/admin/catalog/CatalogShell";
import { Field, inputClassName } from "@/components/form/Field";
import { CustomSelect } from "@/components/ui/CustomSelect";

type UserItem = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
};

export function UserEditor({ id }: { id?: string }) {
  const router = useRouter();
  const isNew = !id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "OPERATOR">("OPERATOR");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    if (!id) return Promise.resolve();
    return fetch(`/api/admin/users/${id}`).then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (response.status === 403) {
        router.push("/admin");
        return;
      }
      const data = (await response.json()) as { item?: UserItem; error?: string };
      if (!response.ok || !data.item) {
        setError(data.error ?? "Не найдено");
        return;
      }
      setName(data.item.name);
      setEmail(data.item.email);
      setRole(data.item.role);
    });
  }, [id, router]);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить пользователя");
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
    const response = await fetch(
      isNew ? "/api/admin/users" : `/api/admin/users/${id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          password: password || undefined,
        }),
      },
    );
    const data = (await response.json()) as { item?: UserItem; error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    if (isNew && data.item) {
      router.push(`/admin/users/${data.item.id}`);
      return;
    }
    setPassword("");
    setNotice("Сохранено");
  }

  async function onDelete() {
    if (!id || !window.confirm("Удалить пользователя?")) return;
    setSaving(true);
    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Не удалось удалить");
      return;
    }
    router.push("/admin/users");
  }

  return (
    <AdminPage
      title={isNew ? "Новый пользователь" : name || "Пользователь"}
      description={
        isNew
          ? "Создайте доступ в админку. Администратор управляет справочниками и пользователями, оператор — заявками и обратной связью."
          : "Пароль меняется только если заполнить поле ниже."
      }
    >
      <CatalogBack href="/admin/users" label="← К списку пользователей" />
      {loading ? (
        <p className="text-sm text-muted">Загрузка…</p>
      ) : (
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="grid max-w-xl gap-5 rounded-3xl border border-line bg-card p-6 sm:p-8"
        >
          <Field id="user-name" label="Имя" required>
            <input
              id="user-name"
              className={inputClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field id="user-email" label="Email" required>
            <input
              id="user-email"
              type="email"
              className={inputClassName}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field id="user-role" label="Роль" required>
            <CustomSelect
              id="user-role"
              value={role}
              options={[
                { value: "OPERATOR", label: "Оператор" },
                { value: "ADMIN", label: "Администратор" },
              ]}
              onChange={(value) => setRole(value as "ADMIN" | "OPERATOR")}
            />
          </Field>
          <Field
            id="user-password"
            label={isNew ? "Пароль" : "Новый пароль"}
            required={isNew}
          >
            <input
              id="user-password"
              type="password"
              className={inputClassName}
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
          {notice ? <p className="text-sm text-gold">{notice}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Сохраняем…" : isNew ? "Создать" : "Сохранить"}
            </button>
            {isNew ? null : (
              <button
                type="button"
                disabled={saving}
                className="rounded-full border border-line px-5 py-3 text-sm text-primary"
                onClick={() => void onDelete()}
              >
                Удалить
              </button>
            )}
          </div>
        </form>
      )}
    </AdminPage>
  );
}
