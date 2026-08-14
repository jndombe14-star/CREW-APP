-- Minimal admin capability: reports are captured (spec §32) but nothing could see
-- them yet. is_admin is a plain column, set only via direct SQL by the project
-- owner — there is deliberately no in-app UI to grant it (avoids privilege escalation).

alter table profiles add column is_admin boolean not null default false;

create policy "admins can see every report"
  on reports for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
