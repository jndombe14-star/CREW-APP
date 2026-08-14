-- Favorites (spec §7, §33): save a profile or a collaboration project to find it again.
-- One polymorphic-ish table with two nullable target columns rather than two separate
-- tables, since the RLS/ownership rule is identical either way.

create table favorites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  favorited_profile_id uuid references profiles (id) on delete cascade,
  favorited_collaboration_id uuid references collaborations (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (
    (favorited_profile_id is not null and favorited_collaboration_id is null)
    or (favorited_profile_id is null and favorited_collaboration_id is not null)
  ),
  unique (owner_id, favorited_profile_id),
  unique (owner_id, favorited_collaboration_id)
);

alter table favorites enable row level security;

create policy "users manage their own favorites"
  on favorites for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
