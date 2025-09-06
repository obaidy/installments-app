-- Simple wallet for micro-topups
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric not null default 0
);

create table if not exists public.wallet_transactions (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null,
  kind text not null check (kind in ('topup','apply','refund')),
  ref text,
  created_at timestamptz default now()
);

