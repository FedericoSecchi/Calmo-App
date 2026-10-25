-- Aplicada en producción el 2026-10-25 desde Claude.ai
--
-- Shared focus rooms + the three RPCs that gate all access to them. The
-- tables themselves keep RLS enabled with zero policies, so clients can only
-- touch them through these SECURITY DEFINER functions.
--
-- This file documents the live schema; running it against a fresh database
-- reproduces production.

create table if not exists public.focus_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]{8}$'),
  created_by uuid references auth.users(id) on delete set null,
  garden_theme text not null default 'zen'
    check (garden_theme in ('zen','sky','companion')),
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

alter table public.focus_rooms enable row level security;

create table if not exists public.room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.focus_rooms(id),
  kind text not null check (kind in ('focus','break','exercise','water')),
  created_at timestamptz not null default now()
);

alter table public.room_events enable row level security;

create index if not exists room_events_room_id_created_at_idx
  on public.room_events (room_id, created_at desc);

-- create_focus_room: authenticated-only. Returns an 8-char [a-z0-9] code.
-- Rate-limited to 10 rooms per user per 24 hours.
create or replace function public.create_focus_room(p_theme text default 'zen')
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_code text;
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_theme not in ('zen','sky','companion') then
    raise exception 'invalid theme';
  end if;
  select count(*) into v_count from public.focus_rooms
    where created_by = auth.uid() and created_at > now() - interval '1 day';
  if v_count >= 10 then
    raise exception 'room limit reached';
  end if;
  loop
    v_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.focus_rooms where code = v_code);
  end loop;
  insert into public.focus_rooms (code, created_by, garden_theme)
    values (v_code, auth.uid(), p_theme);
  return v_code;
end;
$$;

revoke all on function public.create_focus_room(text) from public;
grant execute on function public.create_focus_room(text) to authenticated;

-- get_focus_room: anon-callable. Returns the room meta + today-ish counters
-- for the shared garden. Null row if the code doesn't exist.
create or replace function public.get_focus_room(p_code text)
returns table (
  code text,
  garden_theme text,
  created_at timestamptz,
  focus_count int,
  break_count int,
  exercise_count int,
  water_count int
)
language sql
stable
security definer
set search_path to ''
as $$
  select r.code, r.garden_theme, r.created_at,
    count(*) filter (where e.kind = 'focus')::int,
    count(*) filter (where e.kind = 'break')::int,
    count(*) filter (where e.kind = 'exercise')::int,
    count(*) filter (where e.kind = 'water')::int
  from public.focus_rooms r
  left join public.room_events e on e.room_id = r.id
  where r.code = lower(p_code)
  group by r.code, r.garden_theme, r.created_at;
$$;

revoke all on function public.get_focus_room(text) from public;
grant execute on function public.get_focus_room(text) to anon, authenticated;

-- log_room_event: anon-callable. Rate-limited to 500 events per room per
-- 24 hours; invalid kinds and unknown codes raise.
create or replace function public.log_room_event(p_code text, p_kind text)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_room uuid;
  v_today int;
begin
  if p_kind not in ('focus','break','exercise','water') then
    raise exception 'invalid kind';
  end if;
  select id into v_room from public.focus_rooms where code = lower(p_code);
  if v_room is null then
    raise exception 'room not found';
  end if;
  select count(*) into v_today from public.room_events
    where room_id = v_room and created_at > now() - interval '1 day';
  if v_today >= 500 then
    raise exception 'room event limit reached';
  end if;
  insert into public.room_events (room_id, kind) values (v_room, p_kind);
  update public.focus_rooms set last_active_at = now() where id = v_room;
end;
$$;

revoke all on function public.log_room_event(text, text) from public;
grant execute on function public.log_room_event(text, text) to anon, authenticated;

-- events.name check updated to accept the room/garden analytics names
-- (see migration 005 for the original list). This is the final state:
--   page_view, start_guest, sign_up, login, onboarding_complete,
--   focus_started, break_completed, exercise_completed, pain_logged,
--   water_logged, pricing_view, waitlist_join, pwa_installed,
--   language_changed, room_created, room_joined, room_link_copied,
--   garden_viewed, garden_shared.
