-- CREW: foundation schema for the PRO / COLLAB shell slice.
-- Real, enforced RLS from day one — the client is never trusted for ownership checks.

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- categories (spec §4 / §12): extensible list, shared by pro + collab.
-- ---------------------------------------------------------------------------
create type category_kind as enum ('pro', 'collab', 'both');

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  icon text not null,
  kind category_kind not null default 'both',
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "categories are publicly readable"
  on categories for select
  using (true);

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user. Holds identity + which universes are on.
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  username text unique not null,
  avatar_url text,
  city text,
  location geography(point, 4326),
  bio text,
  is_pro_mode boolean not null default false,
  is_collab_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_location_idx on profiles using gist (location);
create index profiles_username_idx on profiles (username);

alter table profiles enable row level security;

create policy "profiles are publicly readable"
  on profiles for select
  using (true);

create policy "users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- professional_profiles (spec §5): the PRO vitrine.
-- ---------------------------------------------------------------------------
create table professional_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  headline text not null,
  primary_category_id uuid references categories (id),
  secondary_category_ids uuid[] not null default '{}',
  response_time_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table professional_profiles enable row level security;

create policy "professional profiles are publicly readable"
  on professional_profiles for select
  using (true);

create policy "owners manage their professional profile"
  on professional_profiles for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- services (spec §6): what a professional sells.
-- ---------------------------------------------------------------------------
create type price_unit as enum ('hour', 'day', 'project', 'photo', 'video', 'from', 'negotiable');

create table services (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles (id) on delete cascade,
  title text not null,
  description text,
  price_amount numeric(10, 2),
  price_unit price_unit not null default 'negotiable',
  duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_professional_profile_idx on services (professional_profile_id);

alter table services enable row level security;

create policy "services are publicly readable"
  on services for select
  using (true);

create policy "owners manage their own services"
  on services for all
  using (
    auth.uid() = (
      select profile_id from professional_profiles where id = professional_profile_id
    )
  )
  with check (
    auth.uid() = (
      select profile_id from professional_profiles where id = professional_profile_id
    )
  );

-- ---------------------------------------------------------------------------
-- creator_profiles (spec §16): the lightweight COLLAB side, no tariffs.
-- ---------------------------------------------------------------------------
create table creator_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  interests text[] not null default '{}',
  preferred_content_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table creator_profiles enable row level security;

create policy "creator profiles are publicly readable"
  on creator_profiles for select
  using (true);

create policy "owners manage their creator profile"
  on creator_profiles for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger professional_profiles_set_updated_at
  before update on professional_profiles
  for each row execute function set_updated_at();

create trigger services_set_updated_at
  before update on services
  for each row execute function set_updated_at();

create trigger creator_profiles_set_updated_at
  before update on creator_profiles
  for each row execute function set_updated_at();
