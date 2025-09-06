-- Harden helper functions used in RLS to avoid recursive policy evaluation
-- by running with SECURITY DEFINER and a safe search_path.

create or replace function public.is_admin(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = uid and role = 'admin');
$$;

create or replace function public.is_accountant(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = uid and role = 'accountant');
$$;

create or replace function public.is_manager_of(uid uuid, cid bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.manager_complexes where manager_id = uid and complex_id = cid);
$$;

-- Optional helpers
create or replace function public.user_is_approved(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status from public.user_status where user_id = uid), 'pending') = 'approved';
$$;

create or replace function public.client_is_approved_for(uid uuid, cid bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status from public.client_complex_status where user_id = uid and complex_id = cid), 'pending') = 'approved';
$$;

