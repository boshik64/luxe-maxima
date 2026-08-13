"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputClassName } from "@/components/form/Field";
import { Logo } from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Ошибка входа");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Logo className="mb-8 text-foreground" />
      <h1 className="font-[family-name:var(--font-display)] text-2xl">
        Административная панель
      </h1>
      <p className="mt-2 text-sm text-muted">
        Сюда падают заявки со всех лендингов. Доступ только для сотрудников.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field id="email" label="Email" required>
          <input
            id="email"
            type="email"
            className={inputClassName}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field id="password" label="Пароль" required>
          <input
            id="password"
            type="password"
            className={inputClassName}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-primary">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
