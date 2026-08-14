-- Real messaging (spec §25): conversations shared by PRO and COLLAB flows alike.

create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table conversation_members (
  conversation_id uuid not null references conversations (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on messages (conversation_id, created_at);
create index conversation_members_profile_idx on conversation_members (profile_id);

alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;

create policy "members can see their conversations"
  on conversations for select
  using (exists (
    select 1 from conversation_members cm
    where cm.conversation_id = conversations.id and cm.profile_id = auth.uid()
  ));

create policy "members can see other members of their conversations"
  on conversation_members for select
  using (exists (
    select 1 from conversation_members cm
    where cm.conversation_id = conversation_members.conversation_id and cm.profile_id = auth.uid()
  ));

create policy "members can read messages in their conversations"
  on messages for select
  using (exists (
    select 1 from conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.profile_id = auth.uid()
  ));

create policy "members can send messages in their conversations"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversation_members cm
      where cm.conversation_id = messages.conversation_id and cm.profile_id = auth.uid()
    )
  );

-- Creating a conversation and adding both participants must happen atomically and
-- requires inserting a membership row for someone other than the caller, which plain
-- RLS on conversation_members can't allow safely. A security-definer function does
-- the ownership check itself (auth.uid() must be one of the two participants) instead.
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

grant execute on function start_conversation(uuid) to authenticated;

-- Enable Realtime so chat screens get new messages pushed instead of polling.
alter publication supabase_realtime add table messages;
