-- Books Progress Tracker — схема для Supabase
-- Выполни этот SQL в Supabase Dashboard → SQL Editor → New query → Run

-- Книги
create table if not exists public.books (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  author text not null default '',
  total_pages integer not null default 1,
  start_page integer not null default 0,
  current_page integer not null default 0,
  added_at timestamptz,
  started_at text,
  status text not null default 'reading',
  finished_at text,
  history jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists books_user_id_idx on public.books (user_id);

alter table public.books enable row level security;

drop policy if exists "books_select_own" on public.books;
drop policy if exists "books_insert_own" on public.books;
drop policy if exists "books_update_own" on public.books;
drop policy if exists "books_delete_own" on public.books;

create policy "books_select_own"
  on public.books for select
  using (auth.uid() = user_id);

create policy "books_insert_own"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "books_update_own"
  on public.books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "books_delete_own"
  on public.books for delete
  using (auth.uid() = user_id);

-- Цели (сценарии)
create table if not exists public.scenarios (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  deadline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scenarios_user_id_idx on public.scenarios (user_id);

alter table public.scenarios enable row level security;

drop policy if exists "scenarios_select_own" on public.scenarios;
drop policy if exists "scenarios_insert_own" on public.scenarios;
drop policy if exists "scenarios_update_own" on public.scenarios;
drop policy if exists "scenarios_delete_own" on public.scenarios;

create policy "scenarios_select_own"
  on public.scenarios for select
  using (auth.uid() = user_id);

create policy "scenarios_insert_own"
  on public.scenarios for insert
  with check (auth.uid() = user_id);

create policy "scenarios_update_own"
  on public.scenarios for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "scenarios_delete_own"
  on public.scenarios for delete
  using (auth.uid() = user_id);

-- Связь целей и книг
create table if not exists public.scenario_books (
  scenario_id text not null references public.scenarios (id) on delete cascade,
  book_id text not null references public.books (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (scenario_id, book_id)
);

create index if not exists scenario_books_user_id_idx on public.scenario_books (user_id);

alter table public.scenario_books enable row level security;

drop policy if exists "scenario_books_select_own" on public.scenario_books;
drop policy if exists "scenario_books_insert_own" on public.scenario_books;
drop policy if exists "scenario_books_update_own" on public.scenario_books;
drop policy if exists "scenario_books_delete_own" on public.scenario_books;

create policy "scenario_books_select_own"
  on public.scenario_books for select
  using (auth.uid() = user_id);

create policy "scenario_books_insert_own"
  on public.scenario_books for insert
  with check (auth.uid() = user_id);

create policy "scenario_books_update_own"
  on public.scenario_books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "scenario_books_delete_own"
  on public.scenario_books for delete
  using (auth.uid() = user_id);

-- Настройки пользователя
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system',
  week_starts_on integer not null default 1,
  active_scenario_id text,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
drop policy if exists "user_settings_insert_own" on public.user_settings;
drop policy if exists "user_settings_update_own" on public.user_settings;
drop policy if exists "user_settings_delete_own" on public.user_settings;

create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_settings_delete_own"
  on public.user_settings for delete
  using (auth.uid() = user_id);
