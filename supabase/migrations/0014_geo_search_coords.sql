-- The map screen needs each result's actual coordinates to place markers —
-- the original functions only returned distance, which would have put every
-- marker on top of the viewer's own position. Add lat/lng to the return shape.
-- Return type is changing, so the functions must be dropped before recreation.

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
  longitude double precision
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
    st_x(p.location::geometry) as longitude
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
  longitude double precision
)
language sql
stable
as $$
  select
    cp.id as creator_profile_id,
    cp.profile_id,
    st_distance(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography) / 1000.0 as distance_km,
    st_y(p.location::geometry) as latitude,
    st_x(p.location::geometry) as longitude
  from creator_profiles cp
  join profiles p on p.id = cp.profile_id
  where p.location is not null
    and st_dwithin(p.location, st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography, radius_km * 1000)
  order by distance_km asc
  limit 50;
$$;

grant execute on function nearby_creators(double precision, double precision, double precision) to authenticated, anon;
