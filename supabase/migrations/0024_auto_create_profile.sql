-- The client used to insert into `profiles` as a separate step right after
-- supabase.auth.signUp() resolved. Any interruption between those two calls (a crash,
-- a reload, a dropped connection) left a real auth.users row with no matching profiles
-- row — invisible until something tried to insert a child row (creator_profiles,
-- professional_profiles) referencing it and hit a foreign key violation. A trigger makes
-- profile creation atomic with the auth signup itself, so this can no longer happen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'user_' || substr(new.id::text, 1, 8)
  );
  final_username := base_username;

  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || '_' || suffix;
  end loop;

  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Nouveau membre'),
    final_username
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any auth.users rows left orphaned by the old client-side-only insert.
insert into public.profiles (id, full_name, username)
select u.id, 'Nouveau membre', 'user_' || substr(u.id::text, 1, 8)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
