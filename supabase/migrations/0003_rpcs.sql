-- RPCs for admin dashboard KPIs

create or replace function public.sum_due_today() returns numeric language sql stable as $$
  with src as (
    select amount_iqd, due_date, paid from public.installments
  )
  select coalesce(sum(s.amount_iqd), 0) from src s
  where s.paid = false and s.due_date::date = (now() at time zone 'utc')::date
$$;

-- Per complex variants
create or replace function public.sum_due_today_by_complex(cid bigint) returns numeric language sql stable as $$
  select coalesce(sum(i.amount_iqd), 0)
  from public.installments i
  join public.units u on u.id = i.unit_id
  where u.complex_id = cid and i.paid = false and i.due_date::date = (now() at time zone 'utc')::date
$$;

create or replace function public.sum_next_30_by_complex(cid bigint) returns numeric language sql stable as $$
  select coalesce(sum(i.amount_iqd), 0)
  from public.installments i
  join public.units u on u.id = i.unit_id
  where u.complex_id = cid and i.paid = false and i.due_date::date > (now() at time zone 'utc')::date
    and i.due_date::date <= ((now() at time zone 'utc')::date + interval '30 days')
$$;

create or replace function public.sum_past_due_by_complex(cid bigint) returns numeric language sql stable as $$
  select coalesce(sum(i.amount_iqd), 0)
  from public.installments i
  join public.units u on u.id = i.unit_id
  where u.complex_id = cid and i.paid = false and i.due_date::date < (now() at time zone 'utc')::date
$$;

create or replace function public.sum_collected_mtd_by_complex(cid bigint) returns numeric language sql stable as $$
  select coalesce(sum(p.amount), 0)
  from public.payments p
  join public.units u on u.id = p.unit_id
  where u.complex_id = cid and p.status = 'paid'
    and p.paid_at >= date_trunc('month', now() at time zone 'utc')
    and p.paid_at < date_trunc('month', now() at time zone 'utc') + interval '1 month'
$$;

-- Per manager scope (sum across complexes they manage)
create or replace function public.sum_due_today_for_manager(uid uuid) returns numeric language sql stable as $$
  select coalesce(sum(i.amount_iqd), 0)
  from public.installments i
  join public.units u on u.id = i.unit_id
  where i.paid = false and i.due_date::date = (now() at time zone 'utc')::date
    and exists(select 1 from public.manager_complexes mc where mc.manager_id = uid and mc.complex_id = u.complex_id)
$$;

create or replace function public.sum_next_30_for_manager(uid uuid) returns numeric language sql stable as $$
  select coalesce(sum(i.amount_iqd), 0)
  from public.installments i
  join public.units u on u.id = i.unit_id
  where i.paid = false and i.due_date::date > (now() at time zone 'utc')::date
    and i.due_date::date <= ((now() at time zone 'utc')::date + interval '30 days')
    and exists(select 1 from public.manager_complexes mc where mc.manager_id = uid and mc.complex_id = u.complex_id)
$$;

create or replace function public.sum_past_due_for_manager(uid uuid) returns numeric language sql stable as $$
  select coalesce(sum(i.amount_iqd), 0)
  from public.installments i
  join public.units u on u.id = i.unit_id
  where i.paid = false and i.due_date::date < (now() at time zone 'utc')::date
    and exists(select 1 from public.manager_complexes mc where mc.manager_id = uid and mc.complex_id = u.complex_id)
$$;

create or replace function public.sum_collected_mtd_for_manager(uid uuid) returns numeric language sql stable as $$
  select coalesce(sum(p.amount), 0)
  from public.payments p
  join public.units u on u.id = p.unit_id
  where p.status = 'paid'
    and p.paid_at >= date_trunc('month', now() at time zone 'utc')
    and p.paid_at < date_trunc('month', now() at time zone 'utc') + interval '1 month'
    and exists(select 1 from public.manager_complexes mc where mc.manager_id = uid and mc.complex_id = u.complex_id)
$$;

create or replace function public.sum_next_30() returns numeric language sql stable as $$
  with src as (
    select amount_iqd, due_date, paid from public.installments
  )
  select coalesce(sum(s.amount_iqd), 0) from src s
  where s.paid = false and s.due_date::date > (now() at time zone 'utc')::date
    and s.due_date::date <= ((now() at time zone 'utc')::date + interval '30 days')
$$;

create or replace function public.sum_past_due() returns numeric language sql stable as $$
  with src as (
    select amount_iqd, due_date, paid from public.installments
  )
  select coalesce(sum(s.amount_iqd), 0) from src s
  where s.paid = false and s.due_date::date < (now() at time zone 'utc')::date
$$;

create or replace function public.sum_collected_mtd() returns numeric language sql stable as $$
  with src as (
    select amount, paid_at, status from public.payments
  )
  select coalesce(sum(s.amount), 0) from src s
  where s.status = 'paid'
    and s.paid_at >= date_trunc('month', now() at time zone 'utc')
    and s.paid_at < date_trunc('month', now() at time zone 'utc') + interval '1 month'
$$;
