import type { CinemaOption, SessionOption } from "@/lib/karo/types";

export function CinemaCard({
  cinema,
  filmName,
  session,
  sessionCount = 0,
}: {
  cinema: CinemaOption;
  filmName?: string;
  session?: SessionOption | null;
  sessionCount?: number;
}) {
  const posterUrl = session?.posterUrl || cinema.coverUrl;

  return (
    <article className="flex overflow-hidden rounded-3xl border border-line bg-card shadow-lg">
      <div className="w-[7rem] shrink-0 self-stretch bg-primary/10 sm:w-[8.5rem]">
        {posterUrl ? (
          // Постер с CDN КАРО — на всю высоту карточки.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt="" className="h-full min-h-[12rem] w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[12rem] items-center justify-center text-2xl font-semibold text-gold">
            {(filmName || cinema.name || "К").slice(0, 1)}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div>
          <p className="text-sm font-semibold text-gold">Кинотеатр</p>
          <h3 className="mt-1 font-semibold leading-snug">{cinema.name}</h3>
          {cinema.address ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{cinema.address}</p>
          ) : null}
          {filmName ? (
            <p className="mt-2 line-clamp-2 text-sm font-medium">{filmName}</p>
          ) : null}
        </div>
        <div className="mt-4 grid flex-1 grid-cols-2 gap-2">
          <div className="flex min-h-[3.75rem] flex-col rounded-2xl bg-primary/10 px-3 py-2">
            <p className="text-[11px] text-primary/80">Сеансов</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {sessionCount > 0 ? sessionCount : "—"}
            </p>
          </div>
          <div className="flex min-h-[3.75rem] flex-col rounded-2xl bg-primary/10 px-3 py-2">
            <p className="text-[11px] text-primary/80">Возраст</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {session?.ageRestriction != null ? `${session.ageRestriction}+` : "—"}
            </p>
          </div>
          <div className="flex min-h-[3.75rem] flex-col rounded-2xl bg-primary/10 px-3 py-2">
            <p className="text-[11px] text-primary/80">Длительность</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {session?.duration ? `${session.duration} мин` : "—"}
            </p>
          </div>
          <div className="flex min-h-[3.75rem] flex-col rounded-2xl bg-primary/10 px-3 py-2">
            <p className="text-[11px] text-primary/80">Форматы</p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-primary">
              {[...(cinema.formats ?? []), ...(session?.tags ?? [])].filter(Boolean).join(", ") ||
                "—"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
