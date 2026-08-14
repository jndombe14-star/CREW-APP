-- Same real-location upgrade as collaborations, for booking meeting points.

alter table bookings add column latitude double precision;
alter table bookings add column longitude double precision;
