# Books Progress Tracker

## Product

This is a Russian-language personal library and reading-progress tracker. A user
signs in, maintains one library, records the current page of each book, and
groups books into deadline-based reading goals (called scenarios in code).

Before suggesting product features, check the implemented-feature inventory
below and `docs/ARCHITECTURE.md`. Do not present existing behavior as a new idea.

## Implemented features

- Email/password authentication through Supabase.
- Cloud persistence and per-user Row Level Security.
- Book library with title, author, total pages, starting page, and current page.
- Open Library title suggestions and author autofill when adding or editing a book.
- Shelves: reading, queue, and finished.
- Library search and shelf filters.
- Progress updates by exact page, quick `+5`, `+10`, `+20`, custom increment,
  and a `+1` action on book cards.
- Mark as finished, reopen, edit, and delete books.
- Reading goals with a title, deadline, and selected library books.
- One active goal whose remaining pages and daily target are shown on Home.
- Automatic daily-target recalculation from remaining pages and inclusive days
  until the deadline.
- Daily reading totals, current/best streak, and a 119-day activity heatmap.
- Light, dark, and system themes.
- JSON import/export and complete data reset.
- Responsive UI, toast notifications, and completion confetti.
- Automatic GitHub Actions deployment of `dist/` to REG.RU shared hosting over FTPS.

## Architecture map

- `src/App.vue`: application shell, authentication gate, in-memory navigation,
  and orchestration of global modals.
- `src/pages/`: Home, Library, Goals, authentication, and setup-required screens.
- `src/components/`: UI sections, cards, forms, modals, settings, and statistics.
- `src/stores/booksStore.js`: canonical client state, normalization, mutations,
  persistence scheduling, calculations shared across features, import/export.
- `src/composables/`: reactive view models for books, scenarios, statistics,
  authentication, theme, toasts, and confetti.
- `src/api/dataApi.js`: mapping and synchronization between client objects and
  Supabase rows.
- `src/api/bookSearchApi.js`: Open Library search adapter.
- `src/lib/supabase.js`: lazy Supabase client and configuration detection.
- `src/utils/`: dates, IDs, formatting, storage, and shelf classification.
- `supabase/schema.sql`: database tables, relationships, indexes, and RLS rules.
- `.github/workflows/deploy-reg-ru.yml`: production build and FTPS deployment.
- `src/data/my-books-2026.json`: legacy/local seed data.
- `docs/ARCHITECTURE.md`: detailed data flow, domain rules, and change guide.

## Domain rules and invariants

- A book belongs to the library; a deadline belongs to a scenario, not a book.
- A book may be included in multiple scenarios.
- `Scenario.bookIds` defines scenario membership and order.
- Deleting a book must also remove its ID from every scenario.
- `Book.history[YYYY-MM-DD]` stores the book's ending page for that day, not a
  page delta or an individual reading session.
- Daily page totals must be derived from successive history values and
  `startPage`; do not sum history values directly.
- `currentPage`, `startPage`, and history values must remain within
  `0..totalPages`.
- Completing a book sets `currentPage` to `totalPages`, records today's history,
  and sets `finishedAt`. Lowering progress reopens it.
- Shelf `reading` means progress moved beyond `startPage`; an untouched book is
  in `queue`, even though its persisted status is `reading`.
- The daily goal is `ceil(remaining pages / inclusive days to deadline)` for the
  active scenario. Overdue unfinished goals still use a minimum of one day.
- Keep client models and Supabase row mappings compatible when fields change.
- Preserve compatibility with existing local data and exported JSON when
  changing normalization or schemas.

## Persistence and runtime

- The current UI requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  Without them, `SetupRequiredPage` is shown.
- With Supabase configured, authenticated data is loaded from the server and
  deep state changes are synchronized after a 500 ms debounce.
- The store retains localStorage support for legacy/fallback behavior, but the
  current `App.vue` does not expose the main application without Supabase.
- Never print or commit `.env.local` or secrets. The anon key belongs in local
  environment configuration; RLS remains required.
- Production is served from `https://books.dihaos.ru`; GitHub Actions deploys
  only to the server directory stored in `REG_RU_FTP_PATH`.

## Working conventions

- Keep user-facing copy in Russian.
- Reuse existing Tailwind tokens and shared classes from `src/style.css`.
- Put domain mutations in `booksStore.js`, derived reactive state in a
  composable, and remote serialization in `src/api/`.
- Update this file and `docs/ARCHITECTURE.md` when architecture, data models,
  major features, or commands change.
- Inspect the specific files affected by a task; this map replaces broad
  repository discovery, not targeted verification.

## Verification

- Required check: `npm run build`.
- There is currently no automated test suite or lint script.
- For UI work, verify mobile and desktop layouts, light and dark themes, empty
  states, loading/errors, and keyboard behavior where applicable.
- For persistence work, verify login hydration, debounced sync, JSON import, and
  compatibility with `supabase/schema.sql`.
