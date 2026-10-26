-- Aplicada en producción el 2026-10-26 desde Claude.ai.
-- RPC para borrar una sala de foco: solo la puede ejecutar el usuario que la
-- creó. En cascada se borran room_events por la FK con ON DELETE CASCADE.

create or replace function public.delete_focus_room(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.focus_rooms%rowtype;
begin
  if auth.uid() is null then
    raise exception 'room not found or not owner';
  end if;

  select * into v_room
  from public.focus_rooms
  where code = p_code
  for update;

  if not found or v_room.created_by is distinct from auth.uid() then
    raise exception 'room not found or not owner';
  end if;

  delete from public.focus_rooms where id = v_room.id;
end;
$$;

revoke all on function public.delete_focus_room(text) from public, anon;
grant execute on function public.delete_focus_room(text) to authenticated;
