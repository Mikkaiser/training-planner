-- Teams: ownership moves from a person to a team.
--
-- Until now every plan, scheme and run was reachable through
-- `instructor_id = <me>`, written out by hand in 43 SQL sites. Sharing work with
-- a second trainer means that predicate becomes a team, and a missed site would
-- keep working while filtering by the wrong thing.
--
-- So `instructor_id` is RENAMED to `created_by` rather than left in place. Any
-- query not converted now fails at the database instead of silently returning
-- the wrong rows. The column keeps its meaning as provenance — who made this —
-- and stops being an authorization check.
--
-- Every existing user gets a personal team holding everything they already own,
-- so "private" is not a special case: it is a team of one. Every query stays a
-- single uniform `team_id = <active team>`.

begin;

create type public.team_role as enum ('owner', 'member');

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  -- A personal team is created by the migration and cannot be left or renamed;
  -- the app hides its management screen rather than tracking a second flag.
  is_personal boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id   uuid not null references public.teams (id) on delete cascade,
  user_id   uuid not null references public.users (id) on delete cascade,
  role      public.team_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index on public.team_members (user_id);

-- Invitations. token_hash, never the token: this table is a set of live
-- credentials, and a database dump should not be a set of working invites.
create table public.team_invites (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams (id) on delete cascade,
  email       text not null,
  token_hash  text not null unique,
  invited_by  uuid references public.users (id) on delete set null,
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index on public.team_invites (team_id, created_at desc);
-- One live invite per address per team; a revoked or accepted one frees it.
create unique index team_invites_one_open_per_email
  on public.team_invites (team_id, lower(email))
  where accepted_at is null;

-- Which team the user is looking at. Server-side rather than a cookie: this
-- decides what data is returned, and view-modes.ts already documents that a
-- non-HttpOnly cookie is attacker-controlled.
alter table public.users add column active_team_id uuid references public.teams (id) on delete set null;

-- ── The rename, and the new scope ───────────────────────────────────────
alter table public.training_plans     rename column instructor_id to created_by;
alter table public.assessment_schemes rename column instructor_id to created_by;
alter table public.assessment_runs    rename column instructor_id to created_by;

alter table public.training_plans     add column team_id uuid references public.teams (id) on delete cascade;
alter table public.assessment_schemes add column team_id uuid references public.teams (id) on delete cascade;
alter table public.assessment_runs    add column team_id uuid references public.teams (id) on delete cascade;

-- ── Backfill ────────────────────────────────────────────────────────────
insert into public.teams (name, is_personal, created_by)
select coalesce(nullif(u.name, ''), split_part(u.email, '@', 1)) || '''s plans', true, u.id
  from public.users u;

insert into public.team_members (team_id, user_id, role)
select t.id, t.created_by, 'owner' from public.teams t where t.is_personal;

update public.users u set active_team_id = t.id
  from public.teams t where t.is_personal and t.created_by = u.id;

update public.training_plans p set team_id = t.id
  from public.teams t where t.is_personal and t.created_by = p.created_by;

update public.assessment_schemes s set team_id = t.id
  from public.teams t where t.is_personal and t.created_by = s.created_by;

update public.assessment_runs r set team_id = t.id
  from public.teams t where t.is_personal and t.created_by = r.created_by;

-- Only now can it be required: rows existed before the teams did.
alter table public.training_plans     alter column team_id set not null;
alter table public.assessment_schemes alter column team_id set not null;
alter table public.assessment_runs    alter column team_id set not null;

-- Every ownership predicate in the app filters on these.
create index on public.training_plans (team_id, created_at desc);
create index on public.assessment_schemes (team_id, created_at desc);
create index on public.assessment_runs (team_id);

-- created_by is provenance now, not authorization. It may be null once a user
-- is deleted without taking the team's work with them.
alter table public.training_plans     alter column created_by drop not null;
alter table public.assessment_schemes alter column created_by drop not null;
alter table public.assessment_runs    alter column created_by drop not null;

alter table public.training_plans     drop constraint training_plans_instructor_id_fkey;
alter table public.assessment_schemes drop constraint assessment_schemes_instructor_id_fkey;
alter table public.assessment_runs    drop constraint assessment_runs_instructor_id_fkey;

alter table public.training_plans
  add constraint training_plans_created_by_fkey
  foreign key (created_by) references public.users (id) on delete set null;
alter table public.assessment_schemes
  add constraint assessment_schemes_created_by_fkey
  foreign key (created_by) references public.users (id) on delete set null;
alter table public.assessment_runs
  add constraint assessment_runs_created_by_fkey
  foreign key (created_by) references public.users (id) on delete set null;

commit;
