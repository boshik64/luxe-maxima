"use client";

export function PublishStatusButton({
  published,
  pending,
  onToggle,
}: {
  published: boolean;
  pending?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      className={`rounded-full px-3 py-1.5 text-sm ${
        published
          ? "bg-primary/15 text-foreground"
          : "border border-line text-muted"
      } disabled:opacity-60`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
    >
      {pending ? "…" : published ? "Опубликован" : "Скрыт"}
    </button>
  );
}
