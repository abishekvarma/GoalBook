-- Optional cloud sync schema for Project Physique 40.
-- Run only in a new Supabase project after reviewing the schema.
-- Never expose the service_role key in browser code.
create extension if not exists pgcrypto;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  entry jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.workout_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  entry jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  entry jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
alter table public.food_entries enable row level security;
alter table public.workout_entries enable row level security;
alter table public.progress_entries enable row level security;
create policy "users manage own settings" on public.user_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own food" on public.food_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own workouts" on public.workout_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own progress" on public.progress_entries for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Do not store photos in these JSON tables for production. Use a private Storage bucket with owner-scoped policies.
