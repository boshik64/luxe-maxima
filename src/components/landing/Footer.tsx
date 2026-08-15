import { Logo } from "@/components/Logo";
import { KARO_SITE_URL } from "@/lib/contacts";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Logo className="text-muted" />
        <div className="space-y-2 text-sm text-muted">
          <p>© 2007–2026 «КАРО Фильм Менеджмент»</p>
          <p>
            <a
              className="underline decoration-line underline-offset-4 hover:text-foreground"
              href={KARO_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Вернуться на сайт КАРО
            </a>
          </p>
          <p>
            <Link
              className="underline decoration-line underline-offset-4 hover:text-foreground"
              href="/feedback"
            >
              Обратная связь
            </Link>
          </p>
          <p>
            <a
              className="underline decoration-line underline-offset-4 hover:text-foreground"
              href="https://static.karofilm.ru/uploads/filemanager/offer/politika_pers_dannih.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Политика обработки персональных данных
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
