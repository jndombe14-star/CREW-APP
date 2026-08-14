-- Reviews (spec §30): always tied to a real interaction — here, a completed booking.
-- One review per booking, written by the client, publicly readable (shown on profiles).

create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  reviewer_id uuid not null references profiles (id) on delete cascade,
  reviewee_id uuid not null references profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index reviews_reviewee_idx on reviews (reviewee_id);

alter table reviews enable row level security;

create policy "reviews are publicly readable"
  on reviews for select
  using (true);

-- Only the client of a completed booking can review it, exactly once, and only
-- about the professional they actually booked — all enforced server-side.
create policy "clients can review their own completed bookings"
  on reviews for insert
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from bookings b
      join professional_profiles pp on pp.id = b.professional_profile_id
      where b.id = booking_id
        and b.client_id = auth.uid()
        and b.status = 'completed'
        and pp.profile_id = reviewee_id
    )
  );
