-- Exercises can be a link as well as an uploaded file.
--
-- Not every exercise is a document the instructor owns: a lot of practice
-- material lives at a URL already, and re-uploading a copy makes it go stale.
--
-- Both kinds stay in one table because everything downstream — the block card,
-- the clone, the delete cascade, the ordering — treats them identically. A
-- separate table would fork all of that for one differing column.

create type public.exercise_kind as enum ('file', 'link');

alter table public.exercises add column kind public.exercise_kind not null default 'file';
alter table public.exercises add column url text;

-- A link has no object behind it, so the storage columns become optional. The
-- unique index on storage_key still holds: Postgres allows repeated NULLs.
alter table public.exercises alter column storage_key drop not null;
alter table public.exercises alter column content_type drop not null;

-- The old check demanded a positive size, which no link can satisfy.
alter table public.exercises drop constraint if exists exercises_size_bytes_within_limit;
alter table public.exercises
  add constraint exercises_size_bytes_within_limit
  check (size_bytes >= 0 and size_bytes <= 26214400);

-- Each kind must carry its own half and not the other's, so a row can never be
-- ambiguous about where its content actually lives.
alter table public.exercises
  add constraint exercises_kind_shape
  check (
    (kind = 'file' and storage_key is not null and content_type is not null and url is null)
    or (kind = 'link' and url is not null and storage_key is null)
  );

create index on public.exercises (block_id) where kind = 'link';
