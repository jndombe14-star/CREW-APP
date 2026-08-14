-- Proximity search (spec §41): find professionals/creators near a given point.
-- Distances computed server-side via PostGIS, capped at a max radius to avoid
-- scanning the whole table (spec §49: the map/list must never load every user).

create or replace function nearby_professionals(
  origin_lat double precision,
  origin_lng double precision,
  radius_km double precision default 50
)
returns table (
  professional_profile_id uuid,
  profile_id uuid,
  headline text,
  distance_km double precision
)
language sql
stable
as $$
  select
    pp.id as professional_profile_id,
    pp.profile_id,
    pp.headline,
    st_distance(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography) / 1000.0 as distance_km
  from professional_profiles pp
  join profiles p on p.id = pp.profile_id
  where p.location is not null
    and st_dwithin(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography, radius_km * 1000)
  order by distance_km asc
  limit 50;
$$;

create or replace function nearby_creators(
  origin_lat double precision,
  origin_lng double precision,
  radius_km double precision default 50
)
returns table (
  creator_profile_id uuid,
  profile_id uuid,
  distance_km double precision
)
language sql
stable
as $$
  select
    cp.id as creator_profile_id,
    cp.profile_id,
    st_distance(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography) / 1000.0 as distance_km
  from creator_profiles cp
  join profiles p on p.id = cp.profile_id
  where p.location is not null
    and st_dwithin(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography, radius_km * 1000)
  order by distance_km asc
  limit 50;
$$;

grant execute on function nearby_professionals(double precision, double precision, double precision) to authenticated, anon;
grant execute on function nearby_creators(double precision, double precision, double precision) to authenticated, anon;
