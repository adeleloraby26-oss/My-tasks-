-- ============================================================
--  MY TASKS APP — FULL SUPABASE SETUP (Run this once)
--  Paste this entire file in Supabase → SQL Editor → Run
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ─────────────────────────────────────────────────────────────
-- 1. CLEAN SLATE (drop everything if re-running)
-- ─────────────────────────────────────────────────────────────
drop trigger  if exists on_auth_user_created  on auth.users;
drop trigger  if exists on_tasks_updated      on public.tasks;
drop trigger  if exists on_boards_updated     on public.boards;

drop function if exists public.handle_new_user()    cascade;
drop function if exists public.handle_updated_at()  cascade;

drop table if exists public.tasks    cascade;
drop table if exists public.boards   cascade;
drop table if exists public.profiles cascade;

drop type if exists public.task_priority cascade;
drop type if exists public.task_status   cascade;


-- ─────────────────────────────────────────────────────────────
-- 2. CUSTOM TYPES
-- ─────────────────────────────────────────────────────────────
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_status   as enum ('pending', 'in_progress', 'completed');


-- ─────────────────────────────────────────────────────────────
-- 3. PROFILES TABLE
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  username     text        unique not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────
-- 4. BOARDS TABLE
-- ─────────────────────────────────────────────────────────────
create table public.boards (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  title      text        not null,
  color      text        not null default '#4A90E2',
  icon       text        not null default 'folder',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for faster user queries
create index boards_user_id_idx on public.boards(user_id);

-- RLS
alter table public.boards enable row level security;

create policy "boards: all own"
  on public.boards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 5. TASKS TABLE
-- ─────────────────────────────────────────────────────────────
create table public.tasks (
  id           uuid              primary key default uuid_generate_v4(),
  user_id      uuid              not null references public.profiles(id) on delete cascade,
  board_id     uuid              references public.boards(id) on delete set null,
  title        text              not null,
  description  text,
  status       public.task_status   not null default 'pending',
  priority     public.task_priority not null default 'medium',
  due_date     timestamptz,
  completed_at timestamptz,
  created_at   timestamptz       not null default now(),
  updated_at   timestamptz       not null default now()
);

-- Indexes
create index tasks_user_id_idx  on public.tasks(user_id);
create index tasks_board_id_idx on public.tasks(board_id);
create index tasks_status_idx   on public.tasks(status);

-- RLS
alter table public.tasks enable row level security;

create policy "tasks: all own"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 6. UPDATED_AT TRIGGER FUNCTION
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_tasks_updated
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create trigger on_boards_updated
  before update on public.boards
  for each row execute procedure public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 7. AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 8. REALTIME (enable for live sync)
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.boards;


-- ─────────────────────────────────────────────────────────────
-- 9. STORAGE BUCKET FOR AVATARS
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB max
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: user upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: user update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars: user delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ─────────────────────────────────────────────────────────────
-- 10. HELPER VIEW — tasks with board info (optional but useful)
-- ─────────────────────────────────────────────────────────────
create or replace view public.tasks_with_board as
select
  t.*,
  b.title as board_title,
  b.color as board_color
from public.tasks t
left join public.boards b on b.id = t.board_id;


-- ─────────────────────────────────────────────────────────────
-- 11. VERIFY — should return 3 tables
-- ─────────────────────────────────────────────────────────────
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type   = 'BASE TABLE'
order by table_name;

-- ✅ Expected output:
--  boards
--  profiles
--  tasks
