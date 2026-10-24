-- Aplicada en producción el 2026-10-24 desde Claude.ai.
-- Fase 0: privacidad mínima, analítica anónima, lista de espera y persistencia faltante.
-- Nota: al 2026-10-24 la base solo tenía `profiles`; las migraciones 001-004 del repo
-- nunca se habían aplicado. Esta migración crea las tablas de 002-004 (la 001,
-- pain_records, queda obsoleta: el dolor vive solo en el dispositivo).

-- 0. Tablas que el código ya usaba y no existían en producción.
create table if not exists public.reminder_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean default true,
  days integer[] default array[1,2,3,4,5]::integer[],
  times text[] default array['09:00','12:00','15:00','18:00']::text[],
  preset text default 'standard' check (preset in ('light','standard','focus')),
  sound_enabled boolean default true,
  notifications_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.reminder_settings enable row level security;
drop policy if exists "Users can manage own reminder settings" on public.reminder_settings;
create policy "Users can manage own reminder settings" on public.reminder_settings
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
create index if not exists idx_water_logs_user_created on public.water_logs (user_id, created_at desc);
alter table public.water_logs enable row level security;
drop policy if exists "Users can view own water logs" on public.water_logs;
drop policy if exists "Users can insert own water logs" on public.water_logs;
drop policy if exists "Users can delete own water logs" on public.water_logs;
create policy "Users can view own water logs" on public.water_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own water logs" on public.water_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can delete own water logs" on public.water_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.break_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text default 'reminder' check (type in ('reminder','exercise','other')),
  created_at timestamptz default now()
);
create index if not exists idx_break_logs_user_created on public.break_logs (user_id, created_at desc);
alter table public.break_logs enable row level security;
drop policy if exists "Users can view own break logs" on public.break_logs;
drop policy if exists "Users can insert own break logs" on public.break_logs;
drop policy if exists "Users can delete own break logs" on public.break_logs;
create policy "Users can view own break logs" on public.break_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own break logs" on public.break_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can delete own break logs" on public.break_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 1. Analítica anónima (sin user_id, sin IP). Solo insert público.
create table if not exists public.events (
  id bigint generated always as identity primary key,
  name text not null check (name in (
    'page_view','start_guest','sign_up','login','onboarding_complete',
    'focus_started','break_completed','exercise_completed','pain_logged',
    'water_logged','pricing_view','waitlist_join','pwa_installed','language_changed'
  )),
  path text check (char_length(path) <= 200),
  lang text check (lang in ('es','en')),
  session_id uuid,
  referrer_host text check (char_length(referrer_host) <= 100),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists idx_events_name_created on public.events (name, created_at desc);
alter table public.events enable row level security;
drop policy if exists "Anyone can insert events" on public.events;
create policy "Anyone can insert events" on public.events
  for insert to anon, authenticated with check (true);

-- 2. Lista de espera Pro. Solo insert público, nadie lee desde el cliente.
create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  email text not null unique check (
    char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  lang text check (lang in ('es','en')),
  source text check (char_length(source) <= 50),
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
drop policy if exists "Anyone can join waitlist" on public.waitlist;
create policy "Anyone can join waitlist" on public.waitlist
  for insert to anon, authenticated with check (true);

-- 3. Ajustes manuales de pausas (modo autenticado).
create table if not exists public.manual_break_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  adjustment integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
alter table public.manual_break_adjustments enable row level security;
drop policy if exists "Users manage own break adjustments" on public.manual_break_adjustments;
create policy "Users manage own break adjustments" on public.manual_break_adjustments
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 4. Ejercicios completados.
create table if not exists public.exercise_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id text not null check (char_length(exercise_id) <= 100),
  completed_at timestamptz not null default now()
);
create index if not exists idx_exercise_completions_user_date
  on public.exercise_completions (user_id, completed_at desc);
alter table public.exercise_completions enable row level security;
drop policy if exists "Users read own exercise completions" on public.exercise_completions;
drop policy if exists "Users insert own exercise completions" on public.exercise_completions;
create policy "Users read own exercise completions" on public.exercise_completions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own exercise completions" on public.exercise_completions
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- 5. Borrado de cuenta por el propio usuario (cascada a todos sus datos).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 6. Keepalive para que el proyecto free no se pause por inactividad.
create or replace function public.ping()
returns integer
language sql
stable
set search_path = ''
as $$ select 1 $$;
grant execute on function public.ping() to anon, authenticated;
