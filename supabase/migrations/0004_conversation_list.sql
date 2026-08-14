-- Conversation list with other-participant info + last message preview, in one round trip.
-- Not security definer: runs as the calling user so the existing RLS on
-- conversation_members/messages/profiles still applies to every row read here.
create or replace function list_conversations()
returns table (
  conversation_id uuid,
  other_profile_id uuid,
  other_full_name text,
  other_username text,
  other_avatar_url text,
  last_message text,
  last_message_at timestamptz
)
language sql
stable
as $$
  select
    cm.conversation_id,
    other.id as other_profile_id,
    other.full_name as other_full_name,
    other.username as other_username,
    other.avatar_url as other_avatar_url,
    lm.content as last_message,
    lm.created_at as last_message_at
  from conversation_members cm
  join conversation_members other_cm
    on other_cm.conversation_id = cm.conversation_id and other_cm.profile_id != cm.profile_id
  join profiles other on other.id = other_cm.profile_id
  left join lateral (
    select content, created_at
    from messages m
    where m.conversation_id = cm.conversation_id
    order by created_at desc
    limit 1
  ) lm on true
  where cm.profile_id = auth.uid()
  order by coalesce(lm.created_at, cm.joined_at) desc;
$$;

grant execute on function list_conversations() to authenticated;
