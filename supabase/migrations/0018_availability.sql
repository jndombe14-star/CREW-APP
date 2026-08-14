-- Availability (spec §8): weekly working hours + specific blocked dates.
-- Publicly readable (a client needs to see it before booking), owner-managed.

create table weekly_availability (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  unique (professional_profile_id, day_of_week),
  check (end_time > start_time)
);

alter table weekly_availability enable row level security;

create policy "weekly availability is publicly readable"
  on weekly_availability for select
  using (true);

create policy "owners manage their own weekly availability"
  on weekly_availability for all
  using (auth.uid() = (select profile_id from professional_profiles where id = professional_profile_id))
  with check (auth.uid() = (select profile_id from professional_profiles where id = professional_profile_id));

create table availability_blocks (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null references professional_profiles (id) on delete cascade,
  blocked_date date not null,
  reason text,
  unique (professional_profile_id, blocked_date)
);

alter table availability_blocks enable row level security;

create policy "availability blocks are publicly readable"
  on availability_blocks for select
  using (true);

create policy "owners manage their own availability blocks"
  on availability_blocks for all
  using (auth.uid() = (select profile_id from professional_profiles where id = professional_profile_id))
  with check (auth.uid() = (select profile_id from professional_profiles where id = professional_profile_id));
