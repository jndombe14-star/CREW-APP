-- Real location (geocoded, not free text alone) and a time for the meeting —
-- spec §14's "Quand ?" step needs both a date and a time, and "Où ?" should be
-- an actual place, not just a string with no coordinates.

alter table collaborations add column latitude double precision;
alter table collaborations add column longitude double precision;
alter table collaborations add column scheduled_time time;
