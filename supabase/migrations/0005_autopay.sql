-- Autopay toggle on units
alter table if exists public.units
  add column if not exists autopay_enabled boolean default false;

