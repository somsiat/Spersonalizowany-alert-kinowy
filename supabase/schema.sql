
-- === PROFILES ===
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  display_name text,
  email text unique
);

-- === CINEMAS ===
create table if not exists public.cinemas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  city text,
  address text,
  chain text,
  slug text unique
);

create table if not exists public.cinema_sources (
  id uuid primary key default gen_random_uuid(),
  cinema_id uuid not null references public.cinemas(id) on delete cascade,
  url text not null,
  parser_key text not null
);

-- === MOVIES CACHE (TMDb) ===
create table if not exists public.movies (
  id bigint primary key,   -- TMDb id
  title text not null,
  original_title text,
  release_date date,
  overview text,
  poster_path text,
  backdrop_path text,
  tmdb_vote_average numeric,
  tmdb_vote_count int,
  genres text[]
);

-- === SHOWTIMES ===
create table if not exists public.showtimes (
  id uuid primary key default gen_random_uuid(),
  cinema_id uuid not null references public.cinemas(id) on delete cascade,
  tmdb_id bigint references public.movies(id),
  movie_title_raw text not null,
  start_time timestamptz not null,
  language text,
  format text,
  price numeric,
  scraped_at timestamptz default now(),
  unique(cinema_id, movie_title_raw, start_time)
);

-- === USER PREFS ===
create table if not exists public.user_preferences (
  user_id uuid references public.profiles(user_id) on delete cascade,
  min_vote numeric default 6.5,
  preferred_genres text[] default '{}',
  preferred_people text[] default '{}',
  preferred_cinemas uuid[] default '{}',
  exclude_genres text[] default '{}',
  primary key(user_id)
);

-- === PUSH SUBSCRIPTIONS ===
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

-- === ALERTS & NOTIFICATIONS ===
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete cascade,
  showtime_id uuid references public.showtimes(id) on delete cascade,
  reason text,
  score numeric,
  created_at timestamptz default now(),
  seen boolean default false,
  unique(user_id, showtime_id)
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.alerts(id) on delete cascade,
  channel text not null,     -- 'email' | 'webpush'
  status text not null,      -- 'sent' | 'failed'
  provider_id text,
  error text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_showtimes_cinema_time on public.showtimes (cinema_id, start_time);
create index if not exists idx_showtimes_tmdb on public.showtimes (tmdb_id);
create index if not exists idx_alerts_user_created on public.alerts (user_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
create policy if not exists "own profile" on public.profiles for select using (user_id = auth.uid());

alter table public.user_preferences enable row level security;
create policy if not exists "own prefs" on public.user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.alerts enable row level security;
create policy if not exists "own alerts" on public.alerts for select using (user_id = auth.uid());

-- Helper upsert
-- insert into showtimes ... on conflict key
