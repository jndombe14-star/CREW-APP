-- Trust & Safety (spec §31-32): reporting and blocking, with real effect on
-- discovery and messaging — not just a button that records nothing useful.

create table user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id != blocked_id)
);

alter table user_blocks enable row level security;

create policy "users manage their own blocks"
  on user_blocks for all
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  reported_profile_id uuid not null references profiles (id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "users can create and see their own reports"
  on reports for select
  using (reporter_id = auth.uid());

create policy "users can file reports"
  on reports for insert
  with check (reporter_id = auth.uid() and reported_profile_id != auth.uid());

-- Hide blocked profiles from each other (both directions), everywhere profiles
-- are read from — public/anon browsing is unaffected (no auth.uid() to check against).
drop policy "profiles are publicly readable" on profiles;
create policy "profiles are readable unless blocked"
  on profiles for select
  using (
    auth.uid() is null
    or id = auth.uid()
    or not exists (
      select 1 from user_blocks
      where (blocker_id = auth.uid() and blocked_id = profiles.id)
         or (blocker_id = profiles.id and blocked_id = auth.uid())
    )
  );

-- A blocked relationship (either direction) can no longer start a new conversation.
create or replace function start_conversation(other_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  new_id uuid;
begin
  if other_profile_id = auth.uid() then
    raise exception 'cannot start a conversation with yourself';
  end if;

  if exists (
    select 1 from user_blocks
    where (blocker_id = auth.uid() and blocked_id = other_profile_id)
       or (blocker_id = other_profile_id and blocked_id = auth.uid())
  ) then
    raise exception 'cannot start a conversation with a blocked user';
  end if;

  select cm1.conversation_id into existing_id
  from conversation_members cm1
  join conversation_members cm2 on cm2.conversation_id = cm1.conversation_id
  where cm1.profile_id = auth.uid() and cm2.profile_id = other_profile_id
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into conversations default values returning id into new_id;
  insert into conversation_members (conversation_id, profile_id) values (new_id, auth.uid()), (new_id, other_profile_id);

  return new_id;
end;
$$;
