-- Better Auth rate limiter (storage: "database").
-- camelCase quoted so Postgres matches Better Auth 1.6.x queries.

create table if not exists "rateLimit" (
  "id" text primary key not null,
  "key" text not null unique,
  "count" integer not null,
  "lastRequest" bigint not null
);
