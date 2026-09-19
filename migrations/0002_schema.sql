-- DateOs community reports schema.
-- user_id is TEXT to match Better Auth ids (and the preview 'dev-user').
--
-- TODO: si el volumen crece, migrar reports_geo_idx (lat, lng) a PostGIS/geohash
-- y mover photo_data a un bucket/CDN en vez de base64 en la tabla.

create table if not exists profiles (
  user_id      text primary key,
  username     text not null unique,
  display_name text,
  avatar_url   text,
  reputation   numeric not null default 3.0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists reports (
  id                   text primary key,
  user_id              text not null,
  category             text not null,
  problem_type         text not null,
  severity             text not null,
  description          text not null,
  lat                  double precision not null,
  lng                  double precision not null,
  photo_data           text,
  confirmation_count   integer not null default 0,
  resolved_count       integer not null default 0,
  created_at           timestamptz not null default now()
);

create table if not exists report_votes (
  report_id  text not null references reports (id) on delete cascade,
  user_id    text not null,
  vote       text not null check (vote in ('confirm', 'resolved')),
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

create index if not exists reports_geo_idx on reports (lat, lng);
create index if not exists reports_created_idx on reports (created_at desc);
create index if not exists reports_user_idx on reports (user_id);
create index if not exists report_votes_user_idx on report_votes (user_id);
