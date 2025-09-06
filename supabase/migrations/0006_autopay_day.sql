-- Optional smart autopay day (1-28)
alter table if exists public.units
  add column if not exists autopay_day smallint check (autopay_day >= 1 and autopay_day <= 28);

