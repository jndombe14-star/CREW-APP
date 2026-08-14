-- Video in portfolio (spec §7): distinguish photo vs video media.

create type media_type as enum ('photo', 'video');

alter table portfolio_items add column media_type media_type not null default 'photo';
