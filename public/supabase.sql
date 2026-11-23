-- Undercover: tables for optional Google sign-in (run once in Supabase → SQL Editor).
-- Each player can only read and change their own rows (row level security).

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  avatar int default 0,
  games int not null default 0,
  wins int not null default 0,
  und_games int not null default 0,
  und_wins int not null default 0,
  updated_at timestamptz default now()
);
create table if not exists public.friends (
  user_id uuid not null references auth.users on delete cascade,
  pub text not null,
  name text,
  avatar int default 0,
  created_at timestamptz default now(),
  primary key (user_id, pub)
);
create table if not exists public.blocked (
  user_id uuid not null references auth.users on delete cascade,
  pub text not null,
  name text,
  avatar int default 0,
  created_at timestamptz default now(),
  primary key (user_id, pub)
);

alter table public.profiles enable row level security;
alter table public.friends enable row level security;
alter table public.blocked enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "own friends" on public.friends;
create policy "own friends" on public.friends for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own blocked" on public.blocked;
create policy "own blocked" on public.blocked for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Adds one finished game to the signed-in player's record.
create or replace function public.record_game(won boolean, undercover boolean)
returns void language sql security definer set search_path = public as $$
  update public.profiles set
    games = games + 1,
    wins = wins + (case when won then 1 else 0 end),
    und_games = und_games + (case when undercover then 1 else 0 end),
    und_wins = und_wins + (case when undercover and won then 1 else 0 end),
    updated_at = now()
  where id = auth.uid();
$$;
grant execute on function public.record_game(boolean, boolean) to authenticated;
