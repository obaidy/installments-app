-- Atomic wallet operations to avoid race conditions

create or replace function public.wallet_topup(
  p_user_id uuid,
  p_amount numeric,
  p_ref text default null
) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  new_balance numeric;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  insert into wallets(user_id, balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update wallets
  set balance = balance + p_amount
  where user_id = p_user_id
  returning balance into new_balance;

  insert into wallet_transactions(user_id, amount, kind, ref)
  values (p_user_id, p_amount, 'topup', p_ref);

  return coalesce(new_balance, 0);
end;
$$;

create or replace function public.wallet_apply(
  p_user_id uuid,
  p_unit_id bigint default null
) returns table(applied numeric, remaining numeric)
language plpgsql security definer set search_path = public as $$
declare
  bal numeric;
  applied_total numeric := 0;
  rec record;
  apply_amount numeric;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;

  insert into wallets(user_id, balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  select balance into bal from wallets where user_id = p_user_id for update;
  if bal is null or bal <= 0 then
    return query select 0::numeric, coalesce(bal, 0);
    return;
  end if;

  for rec in
    (select 'installment'::text as kind, i.id, i.unit_id, i.amount_iqd as amount, i.due_date
     from installments i
     join units u on u.id = i.unit_id
     where u.user_id = p_user_id and i.paid = false
       and (p_unit_id is null or i.unit_id = p_unit_id)
     union all
     select 'service_fee'::text as kind, f.id, f.unit_id, f.amount_iqd as amount, f.due_date
     from service_fees f
     join units u on u.id = f.unit_id
     where u.user_id = p_user_id and f.paid = false
       and (p_unit_id is null or f.unit_id = p_unit_id)
     order by due_date)
  loop
    exit when bal <= 0;

    if rec.amount <= bal then
      apply_amount := rec.amount;
      insert into payments(unit_id, amount, status, paid_at, installment_id, service_fee_id)
      values (
        rec.unit_id,
        apply_amount,
        'paid',
        now(),
        case when rec.kind = 'installment' then rec.id else null end,
        case when rec.kind = 'service_fee' then rec.id else null end
      );

      if rec.kind = 'installment' then
        update installments set paid = true, paid_at = now() where id = rec.id;
      else
        update service_fees set paid = true, paid_at = now() where id = rec.id;
      end if;
    else
      apply_amount := bal;
      insert into payments(unit_id, amount, status, paid_at, installment_id, service_fee_id)
      values (
        rec.unit_id,
        apply_amount,
        'paid',
        now(),
        case when rec.kind = 'installment' then rec.id else null end,
        case when rec.kind = 'service_fee' then rec.id else null end
      );
      -- leave due open for partial application
    end if;

    insert into wallet_transactions(user_id, amount, kind, ref)
    values (p_user_id, -apply_amount, 'apply', rec.kind || ':' || rec.id);

    applied_total := applied_total + apply_amount;
    bal := bal - apply_amount;
  end loop;

  update wallets set balance = bal where user_id = p_user_id;
  return query select applied_total, bal;
end;
$$;
