-- Collaboration posts + applications (spec §14, §27): the COLLAB counterpart to
-- PRO bookings. A creator publishes a project, others apply, the creator matches
-- with one (or more) applicant, which opens a conversation.

create type collaboration_type as enum ('collaboration', 'exchange', 'free', 'paid', 'group');
create type collaboration_status as enum ('open', 'matched', 'completed', 'cancelled');
create type application_status as enum ('pending', 'accepted', 'declined');

create table collaborations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references profiles (id) on delete cascade,
  category_id uuid references categories (id),
  title text not null,
  description text,
  collaboration_type collaboration_type not null default 'collaboration',
  location text,
  scheduled_date date,
  budget_amount numeric(10, 2),
  status collaboration_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index collaborations_status_idx on collaborations (status, created_at desc);

alter table collaborations enable row level security;

create policy "collaborations are publicly readable"
  on collaborations for select
  using (true);

create policy "creators manage their own collaborations"
  on collaborations for all
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create trigger collaborations_set_updated_at
  before update on collaborations
  for each row execute function set_updated_at();

create table applications (
  id uuid primary key default gen_random_uuid(),
  collaboration_id uuid not null references collaborations (id) on delete cascade,
  applicant_id uuid not null references profiles (id) on delete cascade,
  message text,
  status application_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (collaboration_id, applicant_id)
);

create index applications_collaboration_idx on applications (collaboration_id);
create index applications_applicant_idx on applications (applicant_id);

alter table applications enable row level security;

create policy "applicants and the collaboration creator can see applications"
  on applications for select
  using (
    applicant_id = auth.uid()
    or auth.uid() = (select creator_id from collaborations where id = collaboration_id)
  );

create policy "users can apply to open collaborations"
  on applications for insert
  with check (
    applicant_id = auth.uid()
    and applicant_id != (select creator_id from collaborations where id = collaboration_id)
    and (select status from collaborations where id = collaboration_id) = 'open'
  );

create policy "only the creator can update application status"
  on applications for update
  using (auth.uid() = (select creator_id from collaborations where id = collaboration_id))
  with check (auth.uid() = (select creator_id from collaborations where id = collaboration_id));
