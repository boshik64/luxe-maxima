import type { CinemaOption, SessionOption } from "@/lib/karo/types";

export function CinemaCard({
  cinema,
  filmName,
  session,
}: {
  cinema: CinemaOption;
  filmName?: string;
  session?: SessionOption | null;
}) {
  const age =
    session?.ageRestriction != null ? `${session.ageRestriction}+` : "";
  const duration = session?.duration ? `${session.duration} мин` : "";

  return (
    <article className="w-fit max-w-[min(100%,22rem)] rounded-2xl border border-line bg-card px-4 py-3.5">
      {filmName ? (
        <>
          <p className="text-[11px] tracking-[0.2em] text-gold uppercase">Фильм</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold leading-snug">
            {filmName}
          </h3>
        </>
      ) : null}
      <p className={`${filmName ? "mt-3" : ""} text-[11px] tracking-[0.2em] text-gold uppercase`}>
        Кинотеатр
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{cinema.name}</p>
      {cinema.address ? (
        <p className="mt-0.5 text-sm leading-snug text-muted">{cinema.address}</p>
      ) : null}
      {age || duration ? (
        <p className="mt-3 text-sm text-foreground">
          {[age, duration].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </article>
  );
}
