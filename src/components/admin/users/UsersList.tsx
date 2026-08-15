"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  CatalogRowLink,
  CatalogTable,
  catalogRowClass,
} from "@/components/admin/catalog/CatalogTable";

type UserItem = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
  createdAt: string;
};

const ROLE_LABEL = {
  ADMIN: "Администратор",
  OPERATOR: "Оператор",
};

export function UsersList() {
  const router = useRouter();
  const [items, setItems] = useState<UserItem[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return fetch("/api/admin/users").then(async (response) => {
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (response.status === 403) {
        router.push("/admin");
        return;
      }
      const data = (await response.json()) as {
        items?: UserItem[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить пользователей");
        return;
      }
      setItems(data.items ?? []);
    });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setError("Не удалось загрузить пользователей");
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <AdminPage
      title="Пользователи"
      description="Учётные записи администраторов и операторов. Пароли хранятся только в виде хеша."
      action={
        <Link
          href="/admin/users/new"
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Добавить пользователя
        </Link>
      }
    >
      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      <CatalogTable columns={["Имя", "Email", "Роль", ""]}>
        {items.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted">
              {error ? "Список недоступен." : "Пока нет пользователей."}
            </td>
          </tr>
        ) : (
          items.map((item) => (
            <tr key={item.id} className={catalogRowClass}>
              <td className="px-5 py-4 font-medium">
                <CatalogRowLink href={`/admin/users/${item.id}`}>
                  {item.name}
                </CatalogRowLink>
              </td>
              <td className="px-5 py-4 text-sm text-muted">{item.email}</td>
              <td className="px-5 py-4 text-sm text-muted">
                {ROLE_LABEL[item.role]}
              </td>
              <td className="px-5 py-4 text-right">
                <CatalogRowLink href={`/admin/users/${item.id}`}>
                  Открыть
                </CatalogRowLink>
              </td>
            </tr>
          ))
        )}
      </CatalogTable>
    </AdminPage>
  );
}
