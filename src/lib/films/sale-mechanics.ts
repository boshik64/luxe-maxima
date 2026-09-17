import { prisma } from "@/lib/db";
import { fetchDirectory } from "@/lib/karo/client";

export type FilmSaleMechanicItem = {
  saleId: number;
  enabled: boolean;
  label: string;
  filmCount: number;
  sampleTitles: string[];
};

function filmSaleDelegate() {
  return (
    prisma as unknown as {
      filmSaleMechanic?: {
        findMany: (args?: unknown) => Promise<
          Array<{ saleId: number; enabled: boolean; label: string }>
        >;
        upsert: (args: unknown) => Promise<unknown>;
      };
    }
  ).filmSaleMechanic;
}

export async function getEnabledSaleIds(): Promise<number[] | null> {
  const delegate = filmSaleDelegate();
  if (!delegate) return null;
  const rows = await delegate.findMany();
  if (rows.length === 0) return null;
  return rows.filter((row) => row.enabled).map((row) => row.saleId);
}

export async function listFilmSaleMechanics(): Promise<FilmSaleMechanicItem[]> {
  const [directory, rows] = await Promise.all([
    fetchDirectory(),
    filmSaleDelegate()?.findMany() ?? Promise.resolve([]),
  ]);

  const bySale = new Map<
    number,
    { filmCount: number; sampleTitles: string[] }
  >();
  for (const movie of directory.movie ?? []) {
    const saleId = movie.sale_id;
    if (typeof saleId !== "number" || !Number.isFinite(saleId)) continue;
    const entry = bySale.get(saleId) ?? { filmCount: 0, sampleTitles: [] };
    entry.filmCount += 1;
    if (entry.sampleTitles.length < 5) {
      entry.sampleTitles.push(movie.name);
    }
    bySale.set(saleId, entry);
  }

  const saved = new Map(rows.map((row) => [row.saleId, row]));
  const saleIds = [...new Set([...bySale.keys(), ...saved.keys()])].sort(
    (a, b) => a - b,
  );

  return saleIds.map((saleId) => {
    const meta = bySale.get(saleId) ?? { filmCount: 0, sampleTitles: [] };
    const row = saved.get(saleId);
    return {
      saleId,
      enabled: row?.enabled ?? true,
      label: row?.label ?? "",
      filmCount: meta.filmCount,
      sampleTitles: meta.sampleTitles,
    };
  });
}

export async function saveFilmSaleMechanics(
  items: Array<{ saleId: number; enabled: boolean; label?: string }>,
): Promise<FilmSaleMechanicItem[]> {
  const delegate = filmSaleDelegate();
  if (!delegate) {
    throw Object.assign(new Error("Таблица механик продажи не найдена"), {
      status: 500,
      code: "P2021",
    });
  }

  for (const item of items) {
    if (!Number.isFinite(item.saleId)) continue;
    await delegate.upsert({
      where: { saleId: item.saleId },
      create: {
        saleId: item.saleId,
        enabled: item.enabled,
        label: (item.label ?? "").trim(),
      },
      update: {
        enabled: item.enabled,
        label: (item.label ?? "").trim(),
      },
    });
  }

  return listFilmSaleMechanics();
}
