-- Portfolio media (spec §7): real Supabase Storage buckets, not a fake upload button.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Files are stored under `${auth.uid()}/...` — ownership is the folder name itself.
create policy "avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "portfolio images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'portfolio');

create policy "users upload their own portfolio media"
  on storage.objects for insert
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own portfolio media"
  on storage.objects for delete
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

-- Portfolio items (spec §7): real rows tying uploaded media to a professional profile.
create table portfolio_items (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles (id) on delete cascade,
  media_url text not null,
  title text,
  created_at timestamptz not null default now()
);

create index portfolio_items_professional_profile_idx on portfolio_items (professional_profile_id);

alter table portfolio_items enable row level security;

create policy "portfolio items are publicly readable"
  on portfolio_items for select
  using (true);

create policy "owners manage their own portfolio items"
  on portfolio_items for all
  using (auth.uid() = (select profile_id from professional_profiles where id = professional_profile_id))
  with check (auth.uid() = (select profile_id from professional_profiles where id = professional_profile_id));
