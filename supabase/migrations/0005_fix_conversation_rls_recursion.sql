-- Fix: the original "members can see other members" policy on conversation_members
-- queried conversation_members from within its own USING clause, which re-triggers
-- the same policy on the inner query and recurses infinitely (Postgres error 42P17).
-- Standard fix: a SECURITY DEFINER helper bypasses RLS for the membership check itself,
-- breaking the self-reference while still enforcing "must be a member to see members".

create or replace function is_conversation_member(conv_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from conversation_members
    where conversation_id = conv_id and profile_id = auth.uid()
  );
$$;

grant execute on function is_conversation_member(uuid) to authenticated;

drop policy if exists "members can see other members of their conversations" on conversation_members;
create policy "members can see other members of their conversations"
  on conversation_members for select
  using (is_conversation_member(conversation_id));

drop policy if exists "members can see their conversations" on conversations;
create policy "members can see their conversations"
  on conversations for select
  using (is_conversation_member(id));

drop policy if exists "members can read messages in their conversations" on messages;
create policy "members can read messages in their conversations"
  on messages for select
  using (is_conversation_member(conversation_id));

drop policy if exists "members can send messages in their conversations" on messages;
create policy "members can send messages in their conversations"
  on messages for insert
  with check (sender_id = auth.uid() and is_conversation_member(conversation_id));
