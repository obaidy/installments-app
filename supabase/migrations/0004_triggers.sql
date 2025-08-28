-- Auto-populate profiles and user_status on auth.users insert

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.user_status(user_id, status)
  values (new.id, 'pending')
  on conflict (user_id) do nothing;

  insert into public.profiles(user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill for existing users missing rows
insert into public.user_status(user_id, status)
select u.id, 'pending'
from auth.users u
left join public.user_status s on s.user_id = u.id
where s.user_id is null
on conflict do nothing;

insert into public.profiles(user_id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null
on conflict do nothing;

