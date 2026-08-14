-- Fix: the "profiles are readable unless blocked" policy queries user_blocks in its
-- USING clause, but user_blocks' own RLS ("blocker_id = auth.uid()") means the BLOCKED
-- user can't see the block row that names them — so the hide-from-each-other check only
-- worked one-directionally (the blocker couldn't see the blocked user, but not vice versa).
-- Same root cause as the earlier conversation_members recursion: a policy on table A
-- reading table B is still subject to B's own RLS. Fix: a SECURITY DEFINER helper that
-- bypasses user_blocks' RLS for this specific, narrow check.

create or replace function is_blocked_either_way(other_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from user_blocks
    where (blocker_id = auth.uid() and blocked_id = other_id)
       or (blocker_id = other_id and blocked_id = auth.uid())
  );
$$;

grant execute on function is_blocked_either_way(uuid) to authenticated;

drop policy if exists "profiles are readable unless blocked" on profiles;
create policy "profiles are readable unless blocked"
  on profiles for select
  using (
    auth.uid() is null
    or id = auth.uid()
    or not is_blocked_either_way(id)
  );
