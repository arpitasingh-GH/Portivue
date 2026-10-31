-- Portivue database schema
-- Run this file in Supabase Dashboard > SQL Editor.
-- Safe to re-run. Uses the Supabase Auth user ID as the profile owner.
-- IMPORTANT: Never put a service_role key in frontend environment variables.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text not null default '',
  bio text not null default '',
  skills text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null or username ~ '^[a-z0-9][a-z0-9-]{2,29}$'
  )
);

create table if not exists public.portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 3000),
  entry_type text not null default 'project'
    check (entry_type in ('project', 'certificate', 'hackathon')),
  evidence_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_url_valid check (
    evidence_url is null or evidence_url ~* '^https?://'
  )
);

alter table public.portfolio_entries add column if not exists is_public boolean not null default true;

create index if not exists profiles_username_idx
  on public.profiles(username);

create index if not exists portfolio_entries_user_id_created_at_idx
  on public.portfolio_entries(user_id, created_at desc);

create index if not exists portfolio_entries_is_public_idx
  on public.portfolio_entries(user_id, is_public);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists portfolio_entries_set_updated_at on public.portfolio_entries;
create trigger portfolio_entries_set_updated_at
before update on public.portfolio_entries
for each row execute function public.set_updated_at();

-- Automatically create a profile row whenever a new auth user signs up.
-- The signup trigger runs in the database, so clients cannot skip profile creation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  desired_username text;
begin
  desired_username := lower(coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(coalesce(new.email, ''), '@', 1)
  ));
  desired_username := regexp_replace(desired_username, '[^a-z0-9-]', '-', 'g');
  desired_username := trim(both '-' from desired_username);
  if char_length(desired_username) < 3 then
    desired_username := 'student-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  desired_username := substr(desired_username, 1, 23);

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    desired_username || '-' || substr(replace(new.id::text, '-', ''), 1, 6),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.portfolio_entries enable row level security;

-- Profiles: owners can read/update their own profile; public profile reads are
-- intentionally allowed for portfolio pages. Only owners may insert/update.
drop policy if exists "Public can read profiles" on public.profiles;
create policy "Public can read profiles"
  on public.profiles for select
  using (true);

drop policy if exists "Owners can insert own profile" on public.profiles;
create policy "Owners can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Owners can update own profile" on public.profiles;
create policy "Owners can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Entries: public can read portfolio entries for public portfolios.
-- The app's UI labels evidence links, but does not verify their truth or quality.
drop policy if exists "Public can read portfolio entries" on public.portfolio_entries;
create policy "Public can read portfolio entries"
  on public.portfolio_entries for select
  using (is_public = true or auth.uid() = user_id);

drop policy if exists "Owners can insert own entries" on public.portfolio_entries;
create policy "Owners can insert own entries"
  on public.portfolio_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Owners can update own entries" on public.portfolio_entries;
create policy "Owners can update own entries"
  on public.portfolio_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Owners can delete own entries" on public.portfolio_entries;
create policy "Owners can delete own entries"
  on public.portfolio_entries for delete
  using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.portfolio_entries to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.portfolio_entries to authenticated;