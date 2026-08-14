-- Aggregate rating per profile, shown on PRO profile cards/detail (spec §5, §21).
create view profile_ratings as
  select
    reviewee_id as profile_id,
    round(avg(rating)::numeric, 1) as avg_rating,
    count(*) as review_count
  from reviews
  group by reviewee_id;

grant select on profile_ratings to authenticated, anon;
