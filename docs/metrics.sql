-- Queries útiles sobre `events` (analítica anónima) y tablas de la app.
-- Ejecútalas en el SQL editor de Supabase.
--
-- Todas excluyen tráfico de tests:
--   - waitlist: source = 'e2e' y emails e2e+*@calmo.fit
--   - events: path con ?source=e2e o props.source = 'e2e' (la analítica ya se
--     omite en navegadores automatizados; esto es una segunda red)
--   - tablas de usuario: cuentas con email e2e+*@calmo.fit

-- Embudo semanal: page_view → start_guest/sign_up → focus_started → break_completed
with step as (
  select
    date_trunc('week', created_at) as week,
    count(*) filter (where name = 'page_view') as page_view,
    count(*) filter (where name = 'start_guest') as start_guest,
    count(*) filter (where name = 'sign_up') as sign_up,
    count(*) filter (where name = 'focus_started') as focus_started,
    count(*) filter (where name = 'break_completed') as break_completed
  from public.events
  where created_at >= now() - interval '12 weeks'
    and path not like '%source=e2e%'
    and coalesce(props->>'source', '') <> 'e2e'
  group by 1
)
select
  week,
  page_view,
  start_guest + sign_up as got_in,
  focus_started,
  break_completed,
  case when page_view > 0 then round(((start_guest + sign_up)::numeric / page_view) * 100, 1) else 0 end as pct_got_in
from step
order by week desc;

-- Conversiones de waitlist por semana e idioma.
-- Excluye filas insertadas desde e2e (source = 'e2e') y emails e2e+*@calmo.fit.
select
  date_trunc('week', created_at) as week,
  lang,
  count(*) as joined
from public.waitlist
where created_at >= now() - interval '12 weeks'
  and source is distinct from 'e2e'
  and email not like 'e2e+%@calmo.fit'
group by 1, 2
order by week desc, lang;

-- Idiomas y referrers externos
select
  lang,
  referrer_host,
  count(*) as views
from public.events
where name = 'page_view'
  and created_at >= now() - interval '30 days'
  and path not like '%source=e2e%'
  and coalesce(props->>'source', '') <> 'e2e'
group by 1, 2
order by views desc
limit 50;

-- Retención D1 / D7 basada en pausas registradas (break_logs).
-- Para cada día, cuántos usuarios de D0 volvieron en D1 y en D7.
with daily as (
  select b.user_id, date_trunc('day', b.created_at) as d
  from public.break_logs b
  join auth.users u on u.id = b.user_id
  where b.created_at >= now() - interval '60 days'
    and u.email not like 'e2e+%@calmo.fit'
  group by 1, 2
)
select
  d as cohort_day,
  count(distinct user_id) as cohort_size,
  count(distinct user_id) filter (
    where exists (
      select 1 from daily d1
      where d1.user_id = daily.user_id and d1.d = daily.d + interval '1 day'
    )
  ) as returned_d1,
  count(distinct user_id) filter (
    where exists (
      select 1 from daily d7
      where d7.user_id = daily.user_id and d7.d = daily.d + interval '7 days'
    )
  ) as returned_d7
from daily
group by 1
order by 1 desc;
