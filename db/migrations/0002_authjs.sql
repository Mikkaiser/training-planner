-- Auth.js (NextAuth) schema for @auth/pg-adapter.
-- Reshapes public.users to the adapter contract and adds accounts /
-- sessions / verification_token. Existing user ids are preserved so
-- training_plans.instructor_id keeps pointing at the right row.

alter table public.users rename column full_name to name;
alter table public.users rename column avatar_url to image;
alter table public.users add column if not exists "emailVerified" timestamptz;
alter table public.users drop column if exists password_hash;
alter table public.users drop column if exists updated_at;

create table public.accounts (
  id                  uuid primary key default gen_random_uuid(),
  "userId"            uuid not null references public.users (id) on delete cascade,
  type                varchar(255) not null,
  provider            varchar(255) not null,
  "providerAccountId" varchar(255) not null,
  refresh_token       text,
  access_token        text,
  expires_at          bigint,
  id_token            text,
  scope               text,
  session_state       text,
  token_type          text,
  unique (provider, "providerAccountId")
);

create table public.sessions (
  id             uuid primary key default gen_random_uuid(),
  "userId"       uuid not null references public.users (id) on delete cascade,
  expires        timestamptz not null,
  "sessionToken" varchar(255) not null unique
);

create table public.verification_token (
  identifier text not null,
  expires    timestamptz not null,
  token      text not null,
  primary key (identifier, token)
);

create index on public.accounts ("userId");
create index on public.sessions ("userId");
