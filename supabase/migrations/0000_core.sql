-- Core domain tables (complexes, units, dues, payments)

create table if not exists public.complexes (
  id bigserial primary key,
  name text not null,
  code text unique,
  created_at timestamptz default now()
);

create table if not exists public.units (
  id bigserial primary key,
  complex_id bigint not null references public.complexes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  unit_number text,
  service_fee numeric default 0,
  customer_id text,
  created_at timestamptz default now()
);

create index if not exists units_complex_id_idx on public.units(complex_id);
create index if not exists units_user_id_idx on public.units(user_id);

create table if not exists public.installments (
  id bigserial primary key,
  unit_id bigint not null references public.units(id) on delete cascade,
  amount_iqd numeric not null,
  due_date timestamptz not null,
  paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists installments_unit_id_idx on public.installments(unit_id);
create index if not exists installments_due_date_idx on public.installments(due_date);

create table if not exists public.service_fees (
  id bigserial primary key,
  unit_id bigint not null references public.units(id) on delete cascade,
  label text default 'Service Fee',
  amount_iqd numeric not null,
  due_date timestamptz not null,
  paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists service_fees_unit_id_idx on public.service_fees(unit_id);
create index if not exists service_fees_due_date_idx on public.service_fees(due_date);

create table if not exists public.payments (
  id bigserial primary key,
  unit_id bigint not null references public.units(id) on delete cascade,
  installment_id bigint references public.installments(id) on delete set null,
  service_fee_id bigint references public.service_fees(id) on delete set null,
  amount numeric not null,
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists payments_unit_id_idx on public.payments(unit_id);
create index if not exists payments_installment_id_idx on public.payments(installment_id);
create index if not exists payments_service_fee_id_idx on public.payments(service_fee_id);
create index if not exists payments_paid_at_idx on public.payments(paid_at);
