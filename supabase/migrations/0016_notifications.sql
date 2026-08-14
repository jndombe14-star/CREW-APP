-- In-app notifications (spec §42), created by real triggers on real events —
-- not a client-side fake. Recipients only ever see their own.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  related_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on notifications (recipient_id, created_at desc);

alter table notifications enable row level security;

create policy "users see their own notifications"
  on notifications for select
  using (recipient_id = auth.uid());

create policy "users can mark their own notifications read"
  on notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Triggers run as the acting user by default, but a booking client shouldn't need
-- write access to the pro's notifications row (and vice versa) — this helper is
-- SECURITY DEFINER specifically so triggers can notify the *other* party.
create or replace function create_notification(
  p_recipient_id uuid, p_type text, p_title text, p_body text, p_related_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (recipient_id, type, title, body, related_id)
  values (p_recipient_id, p_type, p_title, p_body, p_related_id);
end;
$$;

-- New booking request → notify the professional.
create or replace function notify_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pro_profile_id uuid;
  client_name text;
begin
  select profile_id into pro_profile_id from professional_profiles where id = new.professional_profile_id;
  select full_name into client_name from profiles where id = new.client_id;
  perform create_notification(pro_profile_id, 'booking_requested', 'Nouvelle demande de réservation',
    coalesce(client_name, 'Quelqu''un') || ' souhaite réserver un de tes services.', new.id);
  return new;
end;
$$;

create trigger bookings_notify_new
  after insert on bookings
  for each row execute function notify_new_booking();

-- Booking status change → notify the client.
create or replace function notify_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('accepted', 'declined', 'completed') then
    perform create_notification(
      new.client_id,
      'booking_status_changed',
      case new.status
        when 'accepted' then 'Réservation acceptée'
        when 'declined' then 'Réservation refusée'
        else 'Réservation terminée'
      end,
      null,
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger bookings_notify_status_change
  after update on bookings
  for each row execute function notify_booking_status_change();

-- New application → notify the collaboration creator.
create or replace function notify_new_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator uuid;
  applicant_name text;
begin
  select creator_id into creator from collaborations where id = new.collaboration_id;
  select full_name into applicant_name from profiles where id = new.applicant_id;
  perform create_notification(creator, 'application_received', 'Nouvelle candidature',
    coalesce(applicant_name, 'Quelqu''un') || ' veut rejoindre ta collaboration.', new.collaboration_id);
  return new;
end;
$$;

create trigger applications_notify_new
  after insert on applications
  for each row execute function notify_new_application();

-- Application status change → notify the applicant.
create or replace function notify_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('accepted', 'declined') then
    perform create_notification(
      new.applicant_id,
      'application_status_changed',
      case new.status when 'accepted' then 'Candidature acceptée 🎉' else 'Candidature refusée' end,
      null,
      new.collaboration_id
    );
  end if;
  return new;
end;
$$;

create trigger applications_notify_status_change
  after update on applications
  for each row execute function notify_application_status_change();

-- New message → notify the other conversation member(s).
create or replace function notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
  member record;
begin
  select full_name into sender_name from profiles where id = new.sender_id;
  for member in
    select profile_id from conversation_members
    where conversation_id = new.conversation_id and profile_id != new.sender_id
  loop
    perform create_notification(member.profile_id, 'new_message', coalesce(sender_name, 'Nouveau message'), new.content, new.conversation_id);
  end loop;
  return new;
end;
$$;

create trigger messages_notify_new
  after insert on messages
  for each row execute function notify_new_message();

alter publication supabase_realtime add table notifications;
