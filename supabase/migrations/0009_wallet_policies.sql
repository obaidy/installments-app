-- RLS for wallet tables
alter table if exists public.wallets enable row level security;
alter table if exists public.wallet_transactions enable row level security;

create policy wallets_self_rw on public.wallets for all using (user_id = auth.uid());
create policy wallet_tx_self_rw on public.wallet_transactions for all using (user_id = auth.uid());

