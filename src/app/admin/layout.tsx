export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Админка — рабочий инструмент, сезонная тема на неё не распространяется.
  return (
    <div className="theme-neutral flex min-h-dvh flex-1 flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
