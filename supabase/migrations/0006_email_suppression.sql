-- Suppression and invite audit tables to reduce bounces
create table if not exists public.email_suppression (
  email text primary key,
  reason text,
  meta jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.email_invite_audit (
  id bigserial primary key,
  email text not null,
  invited_by uuid,
  status text not null check (status in ('sent','skipped','failed')),
  error text,
  details jsonb,
  created_at timestamptz default now()
);

-- Basic RLS (optional): admins only
alter table public.email_suppression enable row level security;
alter table public.email_invite_audit enable row level security;
create policy email_suppression_admin on public.email_suppression for all using (public.is_admin(auth.uid()));
create policy email_invite_audit_admin on public.email_invite_audit for all using (public.is_admin(auth.uid()));
