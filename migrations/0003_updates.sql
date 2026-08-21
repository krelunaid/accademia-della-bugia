-- Personal desk: stay updated after signing in

alter table profiles
  add column if not exists wants_updates boolean not null default true;

alter table profiles
  add column if not exists last_seen_at timestamptz;
