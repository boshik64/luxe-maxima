import { prisma } from "@/lib/db";

function filmSaleDelegate() {
  return (
    prisma as unknown as {
      filmSaleMechanic?: {
        findMany: (args?: unknown) => Promise<
          Array<{ saleId: number; enabled: boolean }>
        >;
      };
    }
  ).filmSaleMechanic;
}

/**
 * Разрешённые `sale_id` для выбора фильма на лендинге.
 * Раздел управления убран из админки: действует то, что уже сохранено в БД
 * (`null` — таблица пуста, фильтра нет).
 */
export async function getEnabledSaleIds(): Promise<number[] | null> {
  const delegate = filmSaleDelegate();
  if (!delegate) return null;
  const rows = await delegate.findMany();
  if (rows.length === 0) return null;
  return rows.filter((row) => row.enabled).map((row) => row.saleId);
}
