-- Core roles and approvals
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','manager','accountant','client'))
);

create table if not exists public.user_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','approved','suspended')) default 'pending',
  approved_by uuid references auth.users(id),
  approved_at timestamptz
);

-- Managers <-> complexes mapping
create table if not exists public.manager_complexes (
  manager_id uuid references auth.users(id) on delete cascade,
  complex_id bigint references public.complexes(id) on delete cascade,
  primary key (manager_id, complex_id)
);

-- Client approval per complex
create table if not exists public.client_complex_status (
  user_id uuid references auth.users(id) on delete cascade,
  complex_id bigint references public.complexes(id) on delete cascade,
  status text not null check (status in ('pending','approved','suspended')) default 'pending',
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  primary key (user_id, complex_id)
);

-- Payment intents (in-flight state)
create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  unit_id bigint references public.units(id) on delete set null,
  target_type text not null check (target_type in ('installment','service_fee')),
  target_id bigint not null,
  amount numeric not null,
  provider text,
  provider_ref text unique,
  status text not null check (status in ('created','requires_action','processing','succeeded','failed','canceled')) default 'created',
  return_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Audit log
create table if not exists public.audit_log (
  id bigserial primary key,
  actor uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id text not null,
  meta jsonb,
  created_at timestamptz default now()
);

-- Lightweight GL tables
create table if not exists public.gl_accounts (
  id serial primary key,
  code text unique not null,
  name text not null,
  type text not null check (type in ('asset','liability','equity','income','expense'))
);

create table if not exists public.gl_entries (
  id bigserial primary key,
  entry_date date not null default current_date,
  memo text,
  posted_by uuid references auth.users(id),
  posted_at timestamptz default now(),
  locked boolean default false
);

create table if not exists public.gl_lines (
  id bigserial primary key,
  entry_id bigint references public.gl_entries(id) on delete cascade,
  account_code text references public.gl_accounts(code),
  dr numeric default 0,
  cr numeric default 0,
  ref_entity text,
  ref_id text
);

-- Reminders & documents
create table if not exists public.reminders (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  target_type text not null,
  target_id bigint not null,
  schedule_at timestamptz not null,
  channel text not null check (channel in ('push','sms','email')),
  template_code text not null,
  state text not null check (state in ('queued','sent','failed')) default 'queued'
);

create table if not exists public.documents (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null,
  url text not null,
  verified boolean default false
);

-- Promises to pay
create table if not exists public.promises (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('installment','service_fee')),
  target_id bigint not null,
  promise_date date not null,
  status text not null check (status in ('open','kept','missed')) default 'open',
  created_at timestamptz default now()
);

-- Optional helpful functions (stubs)
create or replace function public.is_admin(uid uuid) returns boolean language sql stable as $$
  select exists(select 1 from public.user_roles where user_id = uid and role = 'admin')
$$;

create or replace function public.is_accountant(uid uuid) returns boolean language sql stable as $$
  select exists(select 1 from public.user_roles where user_id = uid and role = 'accountant')
$$;

create or replace function public.is_manager_of(uid uuid, cid bigint) returns boolean language sql stable as $$
  select exists(select 1 from public.manager_complexes where manager_id = uid and complex_id = cid)
$$;

create or replace function public.user_is_approved(uid uuid) returns boolean language sql stable as $$
  select coalesce((select status from public.user_status where user_id = uid), 'pending') = 'approved'
$$;

create or replace function public.client_is_approved_for(uid uuid, cid bigint) returns boolean language sql stable as $$
  select coalesce((select status from public.client_complex_status where user_id = uid and complex_id = cid), 'pending') = 'approved'
$$;

-- RLS sketches (adjust for your needs; ensure policies exist on units/installments/service_fees/payments already)
-- Example: gate auth through user_status
-- alter table public.user_roles enable row level security;
-- create policy "user_roles_admin_only" on public.user_roles for all using (is_admin(auth.uid()));

-- Add minimum GL accounts
insert into public.gl_accounts(code, name, type) values
  ('101','Cash & Bank','asset'),
  ('110','Gateway Clearing','asset'),
  ('120','Accounts Receivable – Installments','asset'),
  ('121','Accounts Receivable – Service Fees','asset'),
  ('401','Installment Revenue','income'),
  ('402','Service Fee Income','income'),
  ('403','Late Fee Income','income'),
  ('501','Gateway Fees','expense'),
  ('502','Commissions','expense'),
  ('599','Adjustments/Discounts','expense')
on conflict (code) do nothing;
