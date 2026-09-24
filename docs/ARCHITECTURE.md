# Architecture

## Application overview

Books Progress Tracker is a Vue 3 single-page application written with the
Composition API and styled with Tailwind CSS. It uses local component state for
navigation and modal visibility; there is no Vue Router or external state
management library.

`src/App.vue` is the composition root. It initializes the theme and Supabase
authentication, hydrates user data, selects one of three main views, and owns
the book, goal, and settings modals.

## Main user flows

### Startup and authentication

1. `src/lib/supabase.js` reads `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
2. Without both values, `App.vue` renders `SetupRequiredPage`.
3. With configuration present, `useAuth()` restores the Supabase session.
4. Authenticated users are hydrated through `hydrateFromServer()`.
5. Subsequent deep changes to books, scenarios, or settings schedule a complete
   user-data synchronization after 500 ms.

### Adding a book

1. `BookFormModal.vue` collects title, author, total pages, and current page.
2. A title of at least two characters triggers a debounced Open Library search
   through `src/api/bookSearchApi.js`.
3. Selecting a suggestion fills title and author; page count remains manual
   because it varies by edition.
4. `addBook()` normalizes numeric values, creates history when needed, and adds
   the new book to the canonical store.

### Recording progress

`BookDetailModal.vue` and book-card actions call `setCurrentPage()`. The store
clamps the value and records the resulting ending page under today's local date.
The history model has at most one effective value per book per day: later
updates overwrite the earlier value for that date.

Statistics reconstruct page deltas by sorting each book's history and
subtracting the previous ending page, starting at `startPage`.

### Goals

A scenario contains metadata and an ordered list of library book IDs. It does
not duplicate book data. `scenarioStats()` resolves those IDs against the
library and computes:

- total and read pages;
- remaining pages;
- completed and total books;
- inclusive days until deadline;
- aggregate daily target;
- overdue state.

Only one scenario is active at a time. Home-page planning and daily-focus cards
use the active scenario.

## Client data model

### Book

```text
id: string
title: string
author: string
totalPages: number
startPage: number
currentPage: number
addedAt: ISO timestamp
startedAt: YYYY-MM-DD
status: "reading" | "finished"
finishedAt: YYYY-MM-DD | null
history: Record<YYYY-MM-DD, endingPage>
```

The visible shelf is derived and is not stored:

- `finished`: explicitly finished or at the last page;
- `reading`: current page is greater than the starting baseline;
- `queue`: current page has not moved beyond the starting baseline.

### Scenario

```text
id: string
title: string
deadline: YYYY-MM-DD | null
bookIds: string[]
createdAt: ISO timestamp
```

### Settings

```text
theme: "light" | "dark" | "system"
weekStartsOn: number
activeScenarioId: string | null
```

## State and derived data

`src/stores/booksStore.js` owns the singleton reactive state. All persistent
mutations should remain there so local and remote behavior stay aligned.

`useBooks()` enriches raw books with progress values and shelf groupings.
`useScenarios()` resolves scenario books and statistics. `useStatistics()`
calculates daily totals, streaks, overall counts, the active daily target, and
heatmap data.

Avoid storing values that can be derived from canonical book/scenario data.

## Persistence

Supabase uses four tables:

- `books` for book state and JSON history;
- `scenarios` for goal metadata;
- `scenario_books` for ordered many-to-many membership;
- `user_settings` for theme and active-goal selection.

Every table is scoped by `user_id` and protected by Row Level Security.
`src/api/dataApi.js` is the explicit translation boundary between camelCase
client objects and snake_case database rows.

Synchronization currently sends the user's complete state rather than
individual mutations. It upserts current rows, deletes missing books/goals,
recreates scenario links, and upserts settings.

The store also contains localStorage hydration and seed/migration code. This is
legacy/fallback infrastructure; the current application shell displays setup
instructions instead of the main application when Supabase is absent.

## External services

- Supabase: authentication and persistent user data.
- Open Library Search API: title suggestions and author autofill.
- REG.RU Host-0 shared hosting: static production deployment at
  `https://books.dihaos.ru`.

## Delivery

`.github/workflows/deploy-reg-ru.yml` runs for each push to `main`. It installs
locked dependencies, builds with a root base path and Supabase environment
values, verifies `dist/index.html`, and mirrors `dist/` to the domain-specific
REG.RU directory over FTPS.

Connection details and the remote path are GitHub repository secrets. The
deployment does not use remote deletion, so a wrong path cannot erase unrelated
hosting contents. The exact target directory must be checked in ispmanager
before the first run because the same hosting account serves multiple sites.

Open Library failures are non-blocking: users can always enter book fields
manually.

## Where changes belong

| Change | Primary location |
| --- | --- |
| Persistent book/goal mutation | `src/stores/booksStore.js` |
| Supabase field or table mapping | `src/api/dataApi.js`, `supabase/schema.sql` |
| Derived metrics or planning | `src/composables/useStatistics.js` |
| Shelf definition | `src/utils/bookShelf.js` |
| Date semantics | `src/utils/date.js` |
| Book catalog search | `src/api/bookSearchApi.js` |
| Screen composition/navigation | `src/App.vue`, `src/pages/` |
| Reusable interface | `src/components/` |
| Design tokens/shared classes | `tailwind.config.js`, `src/style.css` |

## Known architectural limitations

- History stores one daily ending page, not individual reading sessions.
- A backwards page correction produces no negative daily activity.
- Sync rewrites broad collections and has no conflict-resolution strategy for
  simultaneous edits on multiple devices.
- Navigation is in-memory and has no addressable routes.
- There are no automated tests or lint command.
- The localStorage path exists in the store but is not available through the
  current application shell.

## Change checklist

When adding a persistent field:

1. Extend normalization and mutations in `booksStore.js`.
2. Extend export/import compatibility.
3. Update both transformations in `dataApi.js`.
4. Add a backward-compatible migration to `supabase/schema.sql` rather than
   assuming a clean database.
5. Update `AGENTS.md` and this document.
6. Run `npm run build` and exercise server hydration and synchronization.
