# КАРО — лендинги заявок и админка

Вариант **«Роскошный максимум»**: три продукта, несколько посадочных, заявки в свою административную панель + письмо менеджеру.

## Лендинги

| URL | Содержание |
| --- | --- |
| `/` | Сводная страница: три продукта и динамическая форма |
| `/keys` | Ключи от зала |
| `/group` | Групповые походы |
| `/event` | Мероприятие в КАРО |
| `/admin` | Админка заявок |

## Стек

Next.js, PostgreSQL, Prisma, JWT-сессии, Nodemailer. Расписание — `https://api.karofilm.ru`.

## Запуск

```bash
cp .env.example .env.local
docker compose up -d
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Вход в админку: `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `.env.local`.
