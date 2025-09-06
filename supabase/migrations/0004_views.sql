-- Consolidated view for a user's dues (installments + service fees)
-- Provides a unified shape used by the mobile dashboard.
create or replace view public.v_user_dues as
  select
    i.id::bigint              as id,
    i.unit_id::bigint         as unit_id,
    i.amount_iqd              as amount_iqd,
    i.due_date                as due_date,
    i.paid                    as paid,
    i.paid_at                 as paid_at,
    'installment'::text       as type,
    u.user_id                 as user_id
  from public.installments i
  join public.units u on u.id = i.unit_id

  union all

  select
    f.id::bigint              as id,
    f.unit_id::bigint         as unit_id,
    f.amount_iqd              as amount_iqd,
    f.due_date                as due_date,
    f.paid                    as paid,
    f.paid_at                 as paid_at,
    'service_fee'::text       as type,
    u.user_id                 as user_id
  from public.service_fees f
  join public.units u on u.id = f.unit_id;

-- Note: RLS policies on installments/service_fees/units continue to apply
-- when querying this view, so users only see rows they are allowed to see.

