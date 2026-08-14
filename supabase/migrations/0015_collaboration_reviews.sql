-- Extend reviews to also cover completed collaborations (spec §30), mutually —
-- unlike a booking (one client reviews one pro), a collaboration match has two
-- people who can each review the other, so uniqueness is per (collaboration, reviewer)
-- rather than one review per collaboration.

alter table reviews alter column booking_id drop not null;
alter table reviews add column collaboration_id uuid references collaborations (id) on delete cascade;

alter table reviews add constraint reviews_exactly_one_target check (
  (booking_id is not null and collaboration_id is null)
  or (booking_id is null and collaboration_id is not null)
);

alter table reviews add constraint reviews_collab_reviewer_unique unique (collaboration_id, reviewer_id);

-- Either the collaboration's creator or its accepted applicant can review the
-- other, once the collaboration is marked completed.
create policy "matched collaborators can review each other after completion"
  on reviews for insert
  with check (
    reviewer_id = auth.uid()
    and collaboration_id is not null
    and exists (
      select 1 from collaborations c
      where c.id = collaboration_id
        and c.status = 'completed'
        and (
          (c.creator_id = auth.uid() and reviewee_id in (
            select applicant_id from applications where collaboration_id = c.id and status = 'accepted'
          ))
          or (
            reviewee_id = c.creator_id
            and auth.uid() in (select applicant_id from applications where collaboration_id = c.id and status = 'accepted')
          )
        )
    )
  );
