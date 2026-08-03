-- Training Planner - plain Postgres schema (post-Supabase)
-- Replaces auth.users with public.users. RLS removed: ownership is
-- enforced in the application layer (instructor_id filters).

create extension if not exists pgcrypto;

-- Enums
create type public.verb_level as enum ('Recognize', 'Apply', 'Produce', 'Optimize');
create type public.competence_type as enum ('Development', 'Testing', 'Analysis & Design', 'Transversal');
create type public.gate_status as enum ('pending', 'passed', 'failed');

-- Users (was auth.users + public.profiles)
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  full_name     text,
  avatar_url    text,
  password_hash text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.training_plans (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.users (id) on delete cascade,
  title         text not null,
  student_name  text not null,
  created_at    timestamptz not null default now()
);

create table public.phases (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.training_plans (id) on delete cascade,
  title       text not null,
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.blocks (
  id              uuid primary key default gen_random_uuid(),
  phase_id        uuid not null references public.phases (id) on delete cascade,
  title           text not null,
  description     text not null default '',
  verb_level      public.verb_level not null default 'Recognize',
  competence_type public.competence_type not null default 'Development',
  hours           numeric(5, 1) not null default 1.0,
  order_index     integer not null default 0,
  created_at      timestamptz not null default now()
);

create table public.gates (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.training_plans (id) on delete cascade,
  after_block_id  uuid not null references public.blocks (id) on delete cascade,
  status          public.gate_status not null default 'pending',
  hours_threshold numeric(5, 1) not null default 0.0,
  created_at      timestamptz not null default now()
);

create index on public.training_plans (instructor_id);
create index on public.phases (plan_id, order_index);
create index on public.blocks (phase_id, order_index);
create index on public.gates (plan_id);
create index on public.gates (after_block_id);
