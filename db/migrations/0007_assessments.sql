-- Assessment guide: marking schemes imported from CIS Excel, and the marking
-- runs recorded against them.
--
-- Two halves that age differently. A scheme is a faithful copy of an uploaded
-- workbook and never changes afterwards — re-importing produces a new scheme
-- row, so runs already marked against the previous version keep their meaning.
-- A run is the part a person types into.

create type public.assessment_aspect_type as enum ('measurement', 'judgement');

create table public.assessment_schemes (
  id               uuid primary key default gen_random_uuid(),
  instructor_id    uuid not null references public.users (id) on delete cascade,
  skill            text not null,
  test_project     text not null,
  source_file_name text not null,
  -- The original workbook, kept for provenance. Null if storage was
  -- unavailable at import; the parsed rows are the source of truth either way.
  storage_key      text unique,
  total_max        numeric(7, 2) not null,
  created_at       timestamptz not null default now()
);

create table public.assessment_criteria (
  id              uuid primary key default gen_random_uuid(),
  scheme_id       uuid not null references public.assessment_schemes (id) on delete cascade,
  letter          text not null,
  name            text not null,
  max_measurement numeric(7, 2),
  max_judgement   numeric(7, 2),
  max_total       numeric(7, 2),
  order_index     integer not null
);

create table public.assessment_sub_criteria (
  id           uuid primary key default gen_random_uuid(),
  criterion_id uuid not null references public.assessment_criteria (id) on delete cascade,
  code         text not null,
  name         text not null,
  order_index  integer not null
);

create table public.assessment_aspects (
  id                uuid primary key default gen_random_uuid(),
  sub_criterion_id  uuid not null references public.assessment_sub_criteria (id) on delete cascade,
  type              public.assessment_aspect_type not null,
  description       text not null,
  -- Column F of the sheet: the deduction rule, or what to look at when judging.
  extra_description text,
  max_mark          numeric(7, 2) not null,
  order_index       integer not null,
  constraint assessment_aspects_max_mark_positive check (max_mark > 0)
);

-- The 0-3 ladder for a judgement aspect. Without it the assessor would be
-- picking a number with nothing to anchor it, so the parser refuses an
-- incomplete set and this table only ever holds complete ones.
create table public.assessment_judgement_descriptors (
  id         uuid primary key default gen_random_uuid(),
  aspect_id  uuid not null references public.assessment_aspects (id) on delete cascade,
  score      smallint not null,
  descriptor text not null,
  constraint assessment_descriptor_score_range check (score between 0 and 3),
  unique (aspect_id, score)
);

create table public.assessment_runs (
  id            uuid primary key default gen_random_uuid(),
  scheme_id     uuid not null references public.assessment_schemes (id) on delete cascade,
  instructor_id uuid not null references public.users (id) on delete cascade,
  -- Which competitor is being marked. Nullable so a run can outlive a deleted
  -- plan rather than being deleted with it.
  plan_id       uuid references public.training_plans (id) on delete set null,
  label         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.assessment_marks (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null references public.assessment_runs (id) on delete cascade,
  aspect_id       uuid not null references public.assessment_aspects (id) on delete cascade,
  -- Measurement aspects carry the awarded mark directly.
  awarded         numeric(7, 2),
  -- Judgement aspects carry the 0-3 score; the mark is derived as
  -- score / 3 * max_mark. Storing the derived value too would let a corrected
  -- score leave a stale number behind.
  judgement_score smallint,
  comment         text,
  updated_at      timestamptz not null default now(),
  unique (run_id, aspect_id),
  constraint assessment_marks_judgement_range check (judgement_score is null or judgement_score between 0 and 3),
  constraint assessment_marks_awarded_non_negative check (awarded is null or awarded >= 0),
  -- Exactly one of the two, never both: a row carrying an awarded mark *and* a
  -- score would have two disagreeing answers for the same aspect.
  constraint assessment_marks_one_kind check (awarded is null or judgement_score is null)
);

create index on public.assessment_schemes (instructor_id, created_at desc);
create index on public.assessment_criteria (scheme_id, order_index);
create index on public.assessment_sub_criteria (criterion_id, order_index);
create index on public.assessment_aspects (sub_criterion_id, order_index);
create index on public.assessment_judgement_descriptors (aspect_id, score);
create index on public.assessment_runs (scheme_id, created_at desc);
create index on public.assessment_runs (plan_id);
create index on public.assessment_marks (run_id);
