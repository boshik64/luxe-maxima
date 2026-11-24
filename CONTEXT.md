# Контекст проекта: luxe-maxima (КАРО Event)

Лендинги заявок и админка сети кинотеатров **КАРО**, вариант «Роскошный максимум». Прод: `https://event.karofilm.ru`. Клиент оставляет заявку на услугу → заявка в канбан + письмо менеджеру.

Инструкция для операторов: [`docs/operators/ИНСТРУКЦИЯ.md`](docs/operators/ИНСТРУКЦИЯ.md) (частично устарела относительно текущей админки).

---

## Стек

| Слой | Технологии |
|------|------------|
| App | Next.js **16.3**, React **19**, TypeScript, App Router (`src/app`) |
| UI | Tailwind **4**, шрифты Manrope / Unbounded / Oswald / Caveat |
| DB | PostgreSQL **16** (Docker), Prisma **6** |
| Auth | JWT (`jose`) в cookie `luxe_admin`, ~12 ч, bcrypt |
| Mail | Nodemailer (SMTP); входящие — EWS (предпочтительно) / IMAP |
| Внешнее API | `https://api.karofilm.ru` — города, кинотеатры, фильмы, сеансы |

Нужны Node **22+**, Docker, порт **5432**. Prisma читает `.env`, Next — `.env.local` (оба из `.env.example`).

После смены схемы Prisma: `npx prisma migrate deploy && npx prisma generate`, затем **перезапуск** `next dev` (в `src/lib/db.ts` есть `SCHEMA_STAMP` для сброса устаревшего клиента в памяти).

---

## Продукты (заявки)

Три продукта в `src/lib/products.ts` / enum `ProductId`:

| ID | Страница | Суть |
|----|----------|------|
| `keys` | `/keys` | «Ключи от зала» — приватный сеанс, зал из каталога, выбор типа контента |
| `group` | `/group` | «Групповой билет» — 7–20 билетов, сеанс из KARO API, условия КАРОНА |
| `event` | `/event` | «Мероприятие» — аренда зала с датой/временем |

Главная `/` — сводный лендинг с выбором услуги и формой. `/feedback` — страница **«Контакты»** (телефон, `event@karofilm.ru`, адрес); формы обратной связи нет.

### Форма `keys` / `event` (аренда)

Шаги: город → кинотеатр → гости → **все залы кинотеатра** (без выбора формата; сортировка по цене ↑, «по запросу» в конце) → дата/время (`DateTimePicker`) → контакты.

Для **`keys`** дополнительно шаг контента (чекбоксы, можно оба, нужен ≥1):

- «Фильм из репертуара» (`wantRepertoireFilm`) — без выбора конкретного фильма
- «Свой контент» (`wantCustomContent`)

Контакты: обязательные **имя** (`contactName`) и **фамилия** (`contactLastName`). В карточке/канбане — «Фамилия Имя».

Каталог аренды (кинотеатры/залы/форматы) — **не вся сеть КАРО**, а свой справочник в `/admin/catalogs`. У зала цены: пн–чт и пт–вс. Формат зала по-прежнему хранится у зала и попадает в snapshot заявки с сервера.

---

## Публичные маршруты

- `/`, `/keys`, `/group`, `/event`, `/feedback` (UI: «Контакты»)
- Тема: `NEXT_PUBLIC_SITE_THEME=winter` (по умолчанию), `autumn` или `classic`; токены в `src/app/globals.css` (`.theme-autumn` / `.theme-winter`), снег — `WinterSnow`
- Герой на главной: картинка full-bleed, текст в контейнере `max-w-6xl` как у остального контента

## Админка `/admin`

| Раздел | Назначение |
|--------|------------|
| `/admin` | Основная доска заявок |
| `/admin/archive` | Доска «Архив» |
| `/admin/catalogs` | Форматы, кинотеатры, залы |
| `/admin/banner` | Перетяжки + карусель на главной (пункт меню может быть скрыт флагом) |
| `/admin/events` | Блок мероприятий на лендинге (в т.ч. ссылка на PDF-презентацию) |
| `/admin/contact-mailto` | Тема и тело `mailto` на странице «Контакты» (**только ADMIN**) |
| `/admin/feedback` | Очередь обращений (раздел **скрыт** в навигации; API/страницы живы) |
| `/admin/users` | Пользователи (только ADMIN) |
| `/admin/profile` | Профиль / подпись писем |

Роли: `ADMIN` \| `OPERATOR`. Уведомления по продуктам — галочки `notifyKeys` / `notifyEvent` (`notifyFeedback` в UI скрыт вместе с разделом ОС).

### Доски заявок

UI: `src/components/admin/AdminDashboard.tsx` (`board: "main" | "archive"`), навигация — `AdminNav`.

Доска определяется **только статусом** (поле `archived` в БД устарело и не используется): `CLOSED` / `REJECTED` — только на «Архиве», остальные — на основной. Смена статуса в карточке/drag-and-drop сразу переносит заявку между досками; чтобы вернуть из архива, нужно сменить статус на активный.

**Основная** (`/admin`):

| Статус | Подпись колонки |
|--------|-----------------|
| `NEW` | Новые заявки |
| `WAITING_REPLY` | Ждем ответа |
| `ANSWERED` | Отвечено |
| `IN_PROGRESS` | В работе |

**Архив** (`/admin/archive`):

| Статус | Подпись колонки |
|--------|-----------------|
| `CLOSED` | Выполнены |
| `REJECTED` | Архив |

На **обеих** досках справа над доской — переключение вида **канбан / список** (иконки; выбор в `localStorage` по ключу доски).

Фильтры: продукт, статус, оплата (Оплачено / Не оплачено / **Красная и не оплачено** — только на основной доске; красные = «В работе» и ≤ 72 ч до мероприятия, считается на клиенте), менеджер, даты создания, **поиск** по полям/комментариям/`KM-N`.

### Карточка заявки

`ApplicationModal`: смена статуса и **менеджера**, checkbox **Оплачено**, дата/время через `DateTimePicker` (как на сайте), переписка с гостем (до **10** вложений на сообщение — `src/lib/chat/limits.ts`).

Подсветка карточек на доске (CSS в `globals.css`: `.admin-card-paid`, `.admin-card-urgent`, `.admin-card-paid-sticker`):

- `paid` → зелёный фон/контур; во «В работе» ещё зелёная полоса справа
- «В работе» и до мероприятия ≤ **72 ч** → красный фон (приоритетнее зелёного); если при этом оплачено — стикер «Оплачено» справа

### Автопереносы

**Ждем ответа** + время мероприятия уже прошло → `REJECTED` («Не актуально»), флаг `autoRejectedOverdue`. Ответ гостя возвращает в `WAITING_REPLY` (без повторного автопереноса). Код: `src/lib/applications/archive-overdue.ts`, `src/lib/chat/service.ts`.
Перенос в архив срабатывает автоматически: «Не актуально» из-за прошедшего мероприятия сразу попадает на доску «Архив». Ответ гостя меняет статус на активный и возвращает заявку на основную доску. Правила «7 дней» и кнопок «В архив» / «На доску заявок» больше нет.

Джоб дергается при листинге заявок и в cron `/api/cron/inbound-mail`.

Константы статусов/подписей: `src/lib/admin/status.ts`. Парсинг даты мероприятия: `src/lib/applications/event-time.ts`.

---

## Доменная модель (Prisma)

- **User** — админы/операторы, prefs уведомлений, подпись
- **Application** — заявка (+ UTM, idempotencyKey, snapshot зала/цен, `contactLastName`, `wantRepertoireFilm`, `wantCustomContent`, **`paid`**, **`statusEnteredAt`**, **`autoRejectedOverdue`**)
- **ApplicationMessage** + **ApplicationAttachment** — чат по заявке (email in/out)
- **Feedback** — обращения (публичная форма отключена)
- **RentalCinema / Hall / HallFormat** — каталог аренды
- **SiteBanner / CarouselSettings / CarouselSlide** — баннеры и карусель
- **EventPromo** — тексты блока мероприятий + `presentationHref` / `presentationLabel`
- **ContactMailto** — тема и тело письма для клика по почте на «Контактах»
- **FilmSaleMechanic** — какие `sale_id` показывать в формах (раздел в админке убран; `getEnabledSaleIds` по-прежнему применяет сохранённое в БД)

Схема: `prisma/schema.prisma`.

Дефолт презентации: `EVENT_PRESENTATION_HREF` в `src/lib/events/types.ts` (PDF на `static.karofilm.ru`). Значение на проде может быть переопределено в `/admin/events` (БД).

---

## API (ключевое)

**Публичные:**  
`/api/applications`, `/api/feedback` (бэкенд формы ОС ещё есть), `/api/captcha`, `/api/catalog/*` (залы: `cinemaId`, `formatId` опционален), `/api/schedule/*` (прокси KARO), `/api/banners`, `/api/carousel`, `/api/events`, `/api/hall-showcase`

**Админ:**  
`/api/admin/login|logout|me`, applications (`?board=main|archive`, `paid`, `q`, …) (+ messages/files), catalogs, banners, carousel, events, **contact-mailto** (ADMIN), feedback, users, managers

PATCH заявки: `src/lib/applications/admin-patch.ts` — в т.ч. `paid`, `managerId`. Смена статуса обновляет `statusEnteredAt`. Создание заявки в админке (POST) принимает `paid` (публичный `/api/applications` — нет). Проверка mailbox только если email реально меняется. Ответ PATCH без `messages` (клиент сохраняет уже загруженную переписку).

**Cron:** `/api/cron/inbound-mail` — входящая почта + автопереносы статусов/архива, защита `CRON_SECRET`

Загрузки баннеров: `uploads/` → rewrite `/uploads/banners/*` → `/api/media/banners/*`

---

## Структура кода

```
src/app/          # страницы + route handlers
src/components/   # landing, form, admin, feedback, ui
src/lib/          # applications, catalog, chat, contacts, email, karo, admin, …
prisma/           # schema, migrations, seed
docs/operators/   # инструкция операторов (частично устарела)
public/autumn/    # визуалы сезонной кампании
```

Бизнес-логика в `src/lib/*`, UI в `src/components/*`. Тесты: `npm test` (tsx; schema, admin-patch, hours, event-time, email, chat, captcha, carousel).

Ключевые места формы: `ApplicationForm`, `RentalHallFields`, `ContentFields`, `HallCards`, `PickCards`, `DatePicker`/`DateTimePicker`; валидация — `src/lib/applications/schema.ts`; отображение ФИО/контента — `src/lib/applications/display.ts`; админ-доска — `AdminDashboard`, `ApplicationModal`, `ApplicationChat`.

---

## Интеграции и env

1. **KARO API** — репертуар/сеансы; статика с `static.karofilm.ru`
2. **SMTP** — письма менеджерам/клиентам; без SMTP заявки всё равно пишутся в БД
3. **EWS** — основной канал входящей почты для чата по заявкам (IMAP на корп. почте часто закрыт)
4. Ключевые переменные: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `SMTP_*`, `EWS_*` / `IMAP_*`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_THEME`

---

## Локальный запуск

```bash
npm install && cp .env.example .env && cp .env.example .env.local
docker compose up -d
npx prisma migrate deploy && npx prisma db seed
npm run dev
```

Логины seed: `admin@karofilm.ru` / `operator@karofilm.ru`, пароль `changeme`.

Повторный запуск: `docker compose up -d && npm run dev`.

После `git pull` с новыми миграциями: `npx prisma migrate deploy` (при необходимости `npx prisma generate` и перезапуск dev).

---

## Git и ветки

- `main` — актуальная база (синхронизирована с `origin/main`, origin: `git@github.com:boshik64/luxe-maxima.git`)
- Текущая рабочая ветка для доработок — **`improvements`**, создана от `main` (2026-11-24). Вносить правки и коммиты в ней, в `main` не коммитить
- Ветка пока только локальная; для отправки: `git push -u origin improvements`
- Прочие ветки на origin: `pravki`, `stage`, `winter`, `test` (не трогать без запроса)

## Важно при доработках

- Это **не** «классический» Next из обучения — смотреть гайды в `node_modules/next/dist/docs/` (см. `AGENTS.md`)
- Каталог аренды ≠ полный каталог сети; правки цен/залов — через админку
- `group` опирается на расписание KARO; `keys`/`event` — на внутренний каталог (без шага «формат зала» в публичной форме)
- `/feedback` — контакты + mailto-шаблон из БД; очередь ОС в админке скрыта
- Сезонная тема и админка разделены: публичка — кампания, админка — нейтральный инструмент (`theme-neutral`)
- Цвета канбана — **свои CSS-классы** в `globals.css`, не палитра Tailwind `emerald-*` / `red-*` (в `@theme` их нет)
- Seed идемпотентен; данные Postgres в docker-томе `luxe_pg`
