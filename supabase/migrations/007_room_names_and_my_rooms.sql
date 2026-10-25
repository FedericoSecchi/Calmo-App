-- Aplicada en producción el 2026-10-25 desde Claude.ai
--
-- Room names + "my rooms" listing + cascade-delete on account removal.
--
-- The app treats a focus room as a reusable piece of state (not a one-shot
-- URL). This migration adds:
--   * focus_rooms.name — optional display name chosen by the creator.
--   * rename_focus_room(p_code, p_name) — owner-only.
--   * get_focus_room_meta(p_code) — anon-callable { code, name, is_owner,
--     last_active_at }, used by the "active room" strip to reconnect without
--     fetching the full event counters.
--   * list_my_rooms() — authenticated-only, returns the caller's own rooms
--     capped at 20, ordered by last_active_at desc.
--   * ON DELETE CASCADE on focus_rooms.created_by so that deleting a user
--     removes their rooms (and the room_events FK cascades too), ending the
--     "orphan rooms with created_by=null" trail from earlier e2e runs.
--
-- This file documents the live schema; running it against a fresh database
-- reproduces production.

alter table public.focus_rooms
  add column if not exists name text
    check (name is null or (char_length(name) between 1 and 40));

-- Replace the created_by FK with ON DELETE CASCADE. The previous migration
-- set it to ON DELETE SET NULL; swap it in place so prior e2e orphan rooms
-- still exist but new deletes cascade.
alter table public.focus_rooms
  drop constraint if exists focus_rooms_created_by_fkey;
alter table public.focus_rooms
  add constraint focus_rooms_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete cascade;

-- room_events already references focus_rooms(id); make sure it cascades too
-- so cleaning a user removes both tables in a single pass.
alter table public.room_events
  drop constraint if exists room_events_room_id_fkey;
alter table public.room_events
  add constraint room_events_room_id_fkey
    foreign key (room_id) references public.focus_rooms(id) on delete cascade;

-- rename_focus_room: owner-only. Trims whitespace, raises on empty strings
-- or lengths >40, and raises when the caller isn't the room's creator.
create or replace function public.rename_focus_room(p_code text, p_name text)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_room public.focus_rooms;
  v_trimmed text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  v_trimmed := nullif(btrim(coalesce(p_name, '')), '');
  if v_trimmed is not null and char_length(v_trimmed) > 40 then
    raise exception 'name too long';
  end if;
  select * into v_room from public.focus_rooms where code = lower(p_code);
  if v_room.id is null then
    raise exception 'room not found';
  end if;
  if v_room.created_by is distinct from auth.uid() then
    raise exception 'not room owner';
  end if;
  update public.focus_rooms
    set name = v_trimmed, last_active_at = now()
    where id = v_room.id;
end;
$$;

revoke all on function public.rename_focus_room(text, text) from public;
grant execute on function public.rename_focus_room(text, text) to authenticated;

-- get_focus_room_meta: anon-callable. Lightweight room meta for the active-
-- room strip and reconnection. Returns an empty set when the code is gone,
-- which the client treats as "room no longer exists".
create or replace function public.get_focus_room_meta(p_code text)
returns table (
  code text,
  name text,
  is_owner boolean,
  last_active_at timestamptz
)
language sql
stable
security definer
set search_path to ''
as $$
  select r.code, r.name,
    (auth.uid() is not null and r.created_by = auth.uid()) as is_owner,
    r.last_active_at
  from public.focus_rooms r
  where r.code = lower(p_code);
$$;

revoke all on function public.get_focus_room_meta(text) from public;
grant execute on function public.get_focus_room_meta(text) to anon, authenticated;

-- list_my_rooms: authenticated-only. Returns up to 20 of the caller's rooms
-- ordered by last activity, newest first.
create or replace function public.list_my_rooms()
returns table (
  code text,
  name text,
  garden_theme text,
  created_at timestamptz,
  last_active_at timestamptz
)
language sql
stable
security definer
set search_path to ''
as $$
  select r.code, r.name, r.garden_theme, r.created_at, r.last_active_at
  from public.focus_rooms r
  where r.created_by = auth.uid()
  order by r.last_active_at desc
  limit 20;
$$;

revoke all on function public.list_my_rooms() from public;
grant execute on function public.list_my_rooms() to authenticated;
