-- "Disponible maintenant" is a simple, user-toggled boolean — distinct from the existing
-- weekly_availability/availability_blocks tables, which model a PRO's recurring working
-- hours, not "I'm free to shoot content right now." Both PRO and COLLAB profiles get one.
alter table professional_profiles add column if not exists is_available boolean not null default false;
alter table creator_profiles add column if not exists is_available boolean not null default false;

-- Simple handle fields, not OAuth — linking real Instagram/TikTok accounts would need
-- developer app registration on each platform (deliberately out of scope for now, see
-- README). A profile just states its handle and we link out to the public page.
alter table profiles add column if not exists instagram_handle text;
alter table profiles add column if not exists tiktok_handle text;

drop function if exists nearby_professionals(double precision, double precision, double precision);
drop function if exists nearby_creators(double precision, double precision, double precision);

create or replace function nearby_professionals(
  origin_lat double precision,
  origin_lng double precision,
  radius_km double precision default 50
)
returns table (
  professional_profile_id uuid,
  profile_id uuid,
  headline text,
  distance_km double precision,
  latitude double precision,
  longitude double precision,
  is_available boolean,
  has_upcoming_booking boolean
)
language sql
stable
as $$
  select
    pp.id as professional_profile_id,
    pp.profile_id,
    pp.headline,
    st_distance(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography) / 1000.0 as distance_km,
    st_y(p.location::geometry) as latitude,
    st_x(p.location::geometry) as longitude,
    pp.is_available,
    exists (
      select 1 from bookings b
      where b.professional_profile_id = pp.id
        and b.status = 'accepted'
        and b.requested_date >= current_date
    ) as has_upcoming_booking
  from professional_profiles pp
  join profiles p on p.id = pp.profile_id
  where p.location is not null
    and st_dwithin(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography, radius_km * 1000)
  order by distance_km asc
  limit 50;
$$;

grant execute on function nearby_professionals(double precision, double precision, double precision) to authenticated, anon;

create or replace function nearby_creators(
  origin_lat double precision,
  origin_lng double precision,
  radius_km double precision default 50
)
returns table (
  creator_profile_id uuid,
  profile_id uuid,
  distance_km double precision,
  latitude double precision,
  longitude double precision,
  is_available boolean,
  has_upcoming_booking boolean
)
language sql
stable
as $$
  select
    cp.id as creator_profile_id,
    cp.profile_id,
    st_distance(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography) / 1000.0 as distance_km,
    st_y(p.location::geometry) as latitude,
    st_x(p.location::geometry) as longitude,
    cp.is_available,
    exists (
      select 1 from collaborations c
      where c.creator_id = cp.profile_id
        and c.status = 'matched'
        and c.scheduled_date >= current_date
      union all
      select 1 from applications a
      join collaborations c2 on c2.id = a.collaboration_id
      where a.applicant_id = cp.profile_id
        and a.status = 'accepted'
        and c2.scheduled_date >= current_date
    ) as has_upcoming_booking
  from creator_profiles cp
  join profiles p on p.id = cp.profile_id
  where p.location is not null
    and st_dwithin(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography, radius_km * 1000)
  order by distance_km asc
  limit 50;
$$;

grant execute on function nearby_creators(double precision, double precision, double precision) to authenticated, anon;
