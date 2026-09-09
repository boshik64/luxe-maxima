#!/usr/bin/env python3
"""Build docs/operators/ИНСТРУКЦИЯ.pdf with embedded Arial (Cyrillic)."""

from __future__ import annotations

import base64
import subprocess
from pathlib import Path

DIR = Path(__file__).resolve().parent
SHOT = DIR / "screenshots"
FONT = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
PDF = DIR / "ИНСТРУКЦИЯ.pdf"
PUBLIC_PDF = DIR.parent.parent / "public" / "docs" / "operator-guide.pdf"
HTML = DIR / "_print.html"


def data_png(name: str) -> str:
    return "data:image/png;base64," + base64.b64encode((SHOT / name).read_bytes()).decode()


def main() -> None:
    font_b64 = base64.b64encode(FONT.read_bytes()).decode()

    # Russian strings as Python unicode — written to UTF-8 HTML.
    title = "Инструкция для операторов КАРО Event"
    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>
@font-face {{
  font-family: 'DocSans';
  src: url(data:font/ttf;base64,{font_b64}) format('truetype');
}}
@page {{ size: A4; margin: 14mm 12mm; }}
* {{ font-family: 'DocSans', Arial, sans-serif !important; }}
body {{ font-size: 11pt; line-height: 1.4; color: #18181b; }}
h1 {{ font-size: 20pt; margin: 0 0 10px; }}
h2 {{ font-size: 14pt; margin: 18px 0 8px; border-bottom: 1px solid #e4e4e7; padding-bottom: 3px; }}
h3 {{ font-size: 12pt; margin: 12px 0 6px; }}
p, li {{ margin: 0 0 6px; }}
a {{ color: #b8122c; }}
table {{ border-collapse: collapse; width: 100%; margin: 8px 0 12px; font-size: 10pt; }}
th, td {{ border: 1px solid #d4d4d8; padding: 5px 7px; text-align: left; vertical-align: top; }}
th {{ background: #f4f4f5; }}
ul, ol {{ padding-left: 1.2em; margin: 0 0 8px; }}
.shot {{ margin: 8px 0 14px; page-break-inside: avoid; }}
.shot img {{ display: block; width: 100%; height: auto; border: 1px solid #e4e4e7; border-radius: 8px; }}
figcaption {{ font-size: 9pt; color: #71717a; margin-top: 3px; }}
.muted {{ color: #52525b; }}
</style>
</head>
<body>
<h1>{title}</h1>
<p>Админка: <a href="https://event.karofilm.ru/admin">https://event.karofilm.ru/admin</a></p>
<p class="muted">Учётную запись выдаёт администратор. Логин — рабочий email, пароль сообщают отдельно.</p>
<h2>1. Вход</h2>
<ol>
  <li>Откройте <a href="https://event.karofilm.ru/admin/login">https://event.karofilm.ru/admin/login</a>.</li>
  <li>Введите email и пароль → <strong>Войти</strong>.</li>
  <li>Сессия ~ <strong>12 часов</strong>. В конце смены — <strong>Выйти</strong>.</li>
</ol>
<figure class="shot"><img src="{data_png("01-login.png")}" alt=""><figcaption>Экран входа</figcaption></figure>
<h2>2. Заявки</h2>
<p>Канбан с колонками:</p>
<table>
  <thead><tr><th>Колонка</th><th>Значение</th></tr></thead>
  <tbody>
    <tr><td><strong>Новая</strong></td><td>Только что с сайта</td></tr>
    <tr><td><strong>В работе</strong></td><td>Связались / уточняете</td></tr>
    <tr><td><strong>Закрыта</strong></td><td>Сделка закрыта / зал сдан</td></tr>
    <tr><td><strong>Отклонена</strong></td><td>Отказ / не подходит</td></tr>
  </tbody>
</table>
<figure class="shot"><img src="{data_png("02-kanban.png")}" alt=""><figcaption>Канбан заявок</figcaption></figure>
<h3>Как работать</h3>
<ol>
  <li>Смотрите колонку <strong>Новая</strong>.</li>
  <li>Статус — перетащите карточку или смените в карточке.</li>
  <li>Открыть карточку — клик по заявке.</li>
  <li>Фильтр: «Ключи от зала» / «Групповой билет» / «Мероприятие в КАРО».</li>
</ol>
<h3>Карточка заявки</h3>
<figure class="shot"><img src="{data_png("03-card.png")}" alt=""><figcaption>Карточка заявки</figcaption></figure>
<ul>
  <li><strong>Статус</strong> и <strong>комментарий администратора</strong> сохраняются сами.</li>
  <li>Поля можно править (контакты, зал, дата).</li>
  <li>Стоимость и вместимость — только просмотр.</li>
  <li>Удаление заявок — только администратор.</li>
</ul>
<p><strong>Письмо «Открыть в админке»</strong> сразу открывает нужную карточку.</p>
<h2>3. Обратная связь</h2>
<p>Отдельная очередь со страницы «Обратная связь» на сайте.</p>
<ol>
  <li>Меню <strong>Обратная связь</strong> (бейдж = число новых).</li>
  <li>Фильтры: Все / Новые / В работе / Закрытые.</li>
  <li>Ответьте клиенту по email/телефону сами.</li>
  <li>Поставьте статус и внутренний комментарий.</li>
</ol>
<figure class="shot"><img src="{data_png("04-feedback.png")}" alt=""><figcaption>Обратная связь</figcaption></figure>
<h2>4. Справочники и мероприятия</h2>
<ul>
  <li><strong>Справочники</strong> — форматы, кинотеатры, залы и цены (пн–чт / пт–вс).</li>
  <li><strong>Мероприятия</strong> — тексты блока на главной.</li>
</ul>
<p>Удаление в справочниках — только админ. Раздел <strong>Пользователи</strong> оператору не виден.</p>
<h2>5. Уведомления на почту</h2>
<p>Письма приходят, если админ включил галочки в вашей карточке:</p>
<ul><li>Ключи от зала</li><li>Мероприятие в КАРО</li><li>Обратная связь</li></ul>
<p>Самостоятельно галочки не включить.</p>
<h2>6. Типовой день</h2>
<ol>
  <li>Войти.</li>
  <li>Новые → В работу, уточнить детали.</li>
  <li>Проверить Обратную связь.</li>
  <li>Закрыть или отклонить.</li>
  <li>Выйти.</li>
</ol>
<h2>Быстрые ссылки</h2>
<table>
  <thead><tr><th>Что</th><th>URL</th></tr></thead>
  <tbody>
    <tr><td>Вход</td><td>https://event.karofilm.ru/admin/login</td></tr>
    <tr><td>Заявки</td><td>https://event.karofilm.ru/admin</td></tr>
    <tr><td>Обратная связь</td><td>https://event.karofilm.ru/admin/feedback</td></tr>
    <tr><td>Справочники</td><td>https://event.karofilm.ru/admin/catalogs</td></tr>
    <tr><td>Сайт</td><td>https://event.karofilm.ru</td></tr>
  </tbody>
</table>
<p>Сбои входа или писем — к администратору / IT.</p>
</body>
</html>
"""
    HTML.write_text(html, encoding="utf-8")
    assert "Вход" in html and "E>4" not in html

    subprocess.run(
        [
            str(CHROME),
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={PDF}",
            HTML.as_uri(),
        ],
        check=True,
        capture_output=True,
    )
    HTML.unlink(missing_ok=True)
    PUBLIC_PDF.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_PDF.write_bytes(PDF.read_bytes())
    print(f"wrote {PDF} ({PDF.stat().st_size} bytes)")
    print(f"wrote {PUBLIC_PDF}")


if __name__ == "__main__":
    main()
