# Books Progress Tracker

Личная библиотека и трекер чтения на Vue 3, Vite, Tailwind CSS и Supabase.

## Возможности

- Авторизация и синхронизация библиотеки через Supabase.
- Добавление книг с поиском по Open Library и автозаполнением автора.
- Полки «Читаю», «В очереди» и «Прочитано», поиск и фильтры.
- Быстрое обновление страницы и автоматический подсчёт прогресса за день.
- Цели с дедлайном и выбранными книгами из общей библиотеки.
- Автоматический расчёт дневного плана для активной цели.
- Серии чтения, статистика и календарь активности за 119 дней.
- Светлая/тёмная тема, импорт и экспорт прогресса в JSON.

## Запуск

```bash
npm install
```

Перед запуском:

1. Создайте проект Supabase.
2. Выполните `supabase/schema.sql` в SQL Editor.
3. Скопируйте `.env.example` в `.env.local` и заполните параметры Supabase.
4. Запустите приложение:

```bash
npm run dev
```

Сборка: `npm run build` → папка `dist/`.

## Автоматический деплой на REG.RU

Workflow `.github/workflows/deploy-reg-ru.yml` собирает приложение и отправляет
содержимое `dist/` в каталог `books.dihaos.ru` по защищённому FTP. Он запускается
автоматически после каждого push в `main` и вручную через вкладку Actions.

В GitHub откройте **Settings → Secrets and variables → Actions** и создайте
Repository secrets:

- `VITE_SUPABASE_URL` — URL проекта Supabase;
- `VITE_SUPABASE_ANON_KEY` — anon key проекта Supabase;
- `REG_RU_FTP_HOST` — `server141.hosting.reg.ru`;
- `REG_RU_FTP_USERNAME` — логин хостинга;
- `REG_RU_FTP_PASSWORD` — пароль FTP;
- `REG_RU_FTP_PATH` — корень только нужного сайта, обычно
  `www/books.dihaos.ru` (точное значение проверьте в ispmanager → Сайты →
  `books.dihaos.ru` → Файлы сайта).

Workflow намеренно не удаляет лишние серверные файлы: это защищает соседние
сайты и файлы от случайного удаления. Устаревшие хешированные assets можно
периодически очищать вручную после проверки пути публикации.

## Стек

- Vue 3 (composition API, `<script setup>`)
- Vite 6
- Tailwind CSS 3 (тёплая, библиотечная палитра — beige / sand / cocoa)
- Supabase Auth и PostgreSQL для персистентности

## Документация проекта

- `AGENTS.md` — краткий контекст, правила и карта проекта для coding agents.
- `docs/ARCHITECTURE.md` — модель данных, основные потоки и границы модулей.
