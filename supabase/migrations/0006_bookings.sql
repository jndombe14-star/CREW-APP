-- Professional bookings (spec §9-10): a client requests a service, the pro accepts/declines.
-- No payment yet (Phase 2 per spec §59) — status set stays intentionally small and honest.

create type booking_status as enum ('requested', 'accepted', 'declined', 'cancelled', 'completed');

create table bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  professional_profile_id uuid not null references professional_profiles (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade,
  requested_date date not null,
  requested_time time,
  location text,
  message text,
  status booking_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_professional_profile_idx on bookings (professional_profile_id);
create index bookings_client_idx on bookings (client_id);

alter table bookings enable row level security;

create policy "clients can create their own booking requests"
  on bookings for insert
  with check (client_id = auth.uid());

create policy "clients and the professional can see relevant bookings"
  on bookings for select
  using (
    client_id = auth.uid()
    or auth.uid() = (select profile_id from professional_profiles where id = professional_profile_id)
  );

create policy "clients and the professional can update relevant bookings"
  on bookings for update
  using (
    client_id = auth.uid()
    or auth.uid() = (select profile_id from professional_profiles where id = professional_profile_id)
  )
  with check (
    client_id = auth.uid()
    or auth.uid() = (select profile_id from professional_profiles where id = professional_profile_id)
  );

create trigger bookings_set_updated_at
  before update on bookings
  for each row execute function set_updated_at();
