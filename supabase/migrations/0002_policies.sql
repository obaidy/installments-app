-- Minimal RLS policy pack aligned with helper functions

-- Enable RLS
alter table if exists public.user_roles enable row level security;
alter table if exists public.user_status enable row level security;
alter table if exists public.manager_complexes enable row level security;
alter table if exists public.client_complex_status enable row level security;
alter table if exists public.complexes enable row level security;
alter table if exists public.units enable row level security;
alter table if exists public.installments enable row level security;
alter table if exists public.service_fees enable row level security;
alter table if exists public.payments enable row level security;
alter table if exists public.payment_intents enable row level security;
alter table if exists public.audit_log enable row level security;
alter table if exists public.gl_accounts enable row level security;
alter table if exists public.gl_entries enable row level security;
alter table if exists public.gl_lines enable row level security;
alter table if exists public.reminders enable row level security;
alter table if exists public.documents enable row level security;

-- Profiles to show emails/names safely to admins
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- user_roles: admin only
create policy user_roles_admin_all on public.user_roles for all using (public.is_admin(auth.uid()));

-- user_status: admin only read/write
create policy user_status_admin_all on public.user_status for all using (public.is_admin(auth.uid()));
create policy user_status_self_read on public.user_status for select using (user_id = auth.uid());

-- manager_complexes: admin read/write; manager can read own
create policy manager_complexes_admin_all on public.manager_complexes for all using (public.is_admin(auth.uid()));
create policy manager_complexes_manager_read on public.manager_complexes for select using (manager_id = auth.uid());

-- client_complex_status: admin read/write; manager read/write within complex; client read own rows
create policy client_complex_admin_all on public.client_complex_status for all using (public.is_admin(auth.uid()));
create policy client_complex_manager_all on public.client_complex_status for all using (public.is_manager_of(auth.uid(), complex_id));
create policy client_complex_client_read on public.client_complex_status for select using (user_id = auth.uid());
create policy client_complex_client_request on public.client_complex_status for insert with check (user_id = auth.uid() and status = 'pending');

-- profiles: admin read; user can read own
create policy profiles_admin_read on public.profiles for select using (public.is_admin(auth.uid()));
create policy profiles_self_read on public.profiles for select using (user_id = auth.uid());
create policy profiles_self_upsert on public.profiles for insert with check (user_id = auth.uid());
create policy profiles_self_update on public.profiles for update using (user_id = auth.uid());

-- complexes: admin read/write; manager read within assignments; others read minimal
create policy complexes_admin_all on public.complexes for all using (public.is_admin(auth.uid()));
create policy complexes_manager_read on public.complexes for select using (
  exists(select 1 from public.manager_complexes mc where mc.complex_id = complexes.id and mc.manager_id = auth.uid())
);
create policy complexes_public_read on public.complexes for select using (true);

-- units: owner read own; manager read within complex; accountant/admin read; write limited
create policy units_owner_read on public.units for select using (user_id = auth.uid());
create policy units_manager_read on public.units for select using (public.is_manager_of(auth.uid(), complex_id));
create policy units_accountant_read on public.units for select using (public.is_accountant(auth.uid()));
create policy units_admin_all on public.units for all using (public.is_admin(auth.uid()));

-- installments
create policy installments_owner_read on public.installments for select using (
  exists(select 1 from public.units u where u.id = installments.unit_id and (u.user_id = auth.uid()))
);
create policy installments_manager_read on public.installments for select using (
  exists(select 1 from public.units u where u.id = installments.unit_id and public.is_manager_of(auth.uid(), u.complex_id))
);
create policy installments_accountant_read on public.installments for select using (public.is_accountant(auth.uid()));
create policy installments_admin_all on public.installments for all using (public.is_admin(auth.uid()));

-- service_fees
create policy service_fees_owner_read on public.service_fees for select using (
  exists(select 1 from public.units u where u.id = service_fees.unit_id and (u.user_id = auth.uid()))
);
create policy service_fees_manager_read on public.service_fees for select using (
  exists(select 1 from public.units u where u.id = service_fees.unit_id and public.is_manager_of(auth.uid(), u.complex_id))
);
create policy service_fees_accountant_read on public.service_fees for select using (public.is_accountant(auth.uid()));
create policy service_fees_admin_all on public.service_fees for all using (public.is_admin(auth.uid()));

-- payments
create policy payments_owner_read on public.payments for select using (
  exists(select 1 from public.units u where u.id = payments.unit_id and (u.user_id = auth.uid()))
);
create policy payments_manager_read on public.payments for select using (
  exists(select 1 from public.units u where u.id = payments.unit_id and public.is_manager_of(auth.uid(), u.complex_id))
);
create policy payments_accountant_read on public.payments for select using (public.is_accountant(auth.uid()));
create policy payments_admin_all on public.payments for all using (public.is_admin(auth.uid()));

-- payment_intents: admin/accountant read; owner read own via unit link
create policy intents_admin_read on public.payment_intents for select using (public.is_admin(auth.uid()) or public.is_accountant(auth.uid()));
create policy intents_owner_read on public.payment_intents for select using (
  exists(select 1 from public.units u where u.id = payment_intents.unit_id and (u.user_id = auth.uid()))
);

-- audit_log: admin/accountant read; admin insert via app server
create policy audit_admin_read on public.audit_log for select using (public.is_admin(auth.uid()) or public.is_accountant(auth.uid()));
create policy audit_admin_insert on public.audit_log for insert with check (public.is_admin(auth.uid()));

-- GL tables: accountant/admin read/write; managers read-only
create policy gl_admin_all on public.gl_accounts for all using (public.is_admin(auth.uid()) or public.is_accountant(auth.uid()));
create policy gl_entries_admin_all on public.gl_entries for all using (public.is_admin(auth.uid()) or public.is_accountant(auth.uid()));
create policy gl_lines_admin_all on public.gl_lines for all using (public.is_admin(auth.uid()) or public.is_accountant(auth.uid()));
create policy gl_manager_read on public.gl_entries for select using (public.is_manager_of(auth.uid(), null)); -- adjust if scoping by complex
create policy gl_manager_lines_read on public.gl_lines for select using (public.is_manager_of(auth.uid(), null));

-- reminders/documents/promises: owner read own; admin/manager read within complex; admin write
create policy reminders_owner_read on public.reminders for select using (user_id = auth.uid());
create policy reminders_admin_all on public.reminders for all using (public.is_admin(auth.uid()));

create policy documents_owner_rw on public.documents for all using (user_id = auth.uid());
create policy documents_admin_read on public.documents for select using (public.is_admin(auth.uid()));

create policy promises_owner_rw on public.promises for all using (user_id = auth.uid());
create policy promises_admin_read on public.promises for select using (public.is_admin(auth.uid()));
