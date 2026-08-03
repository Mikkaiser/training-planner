-- Exercise files attached to a block.
--
-- Bytes live in the S3/MinIO bucket; this table is the only index of them.
-- Ownership is derived block -> phase -> training_plans.instructor_id, the same
-- join every other write path in src/actions/ uses. There is no RLS.
--
-- The row is created *before* the browser uploads, in the pending state, and
-- flips to ready only once the server has confirmed the object exists. Creating
-- it afterwards would mean a successful upload followed by a failed insert
-- leaves an object nothing has a record of — unfindable and unsweepable.
-- Failing this way round leaves a row that knows its own key, so it can be
-- cleaned up. Reads filter on status = 'ready', so a half-finished upload is
-- simply invisible.

create type public.exercise_status as enum ('pending', 'ready');

create table public.exercises (
  id           uuid primary key default gen_random_uuid(),
  block_id     uuid not null references public.blocks (id) on delete cascade,
  file_name    text not null,
  -- Unique because each row owns exactly one object: cloning a plan copies the
  -- object server-side rather than sharing a key, so deleting one exercise can
  -- never pull the file out from under another row.
  storage_key  text not null unique,
  content_type text not null,
  -- integer, not bigint: 25 MiB is far below int4's ceiling, and node-postgres
  -- returns int8 as a string, which would force a cast on every read.
  size_bytes   integer not null,
  status       public.exercise_status not null default 'pending',
  uploaded_by  uuid references public.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  uploaded_at  timestamptz,
  -- 26214400 = 25 * 1024 * 1024, the limit the design's drop zone advertises.
  -- The same constant is enforced in the zod schema and in the signed
  -- ContentLength, so a client cannot talk its way past it.
  constraint exercises_size_bytes_within_limit check (size_bytes > 0 and size_bytes <= 26214400)
);

create index on public.exercises (block_id, created_at);
create index on public.exercises (created_at) where status = 'pending';
