-- Pay links that allow a trusted payer to pay on behalf of a user
create table if not exists public.paylinks (
  token text primary key,
  unit_id bigint references public.units(id) on delete cascade,
  target_type text not null check (target_type in ('installment','service_fee','batch')),
  target_id bigint,
  amount numeric,
  expires_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

