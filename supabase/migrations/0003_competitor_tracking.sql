-- Competitor progress tracking: competitors, per-plan progress, gate attempts.
-- Builds on 0001_init.sql (profiles/phases/topics/gates/exercises) and
-- 0002_add_color_to_training_plans.sql.

-- Safety: exercises.topic_id is already defined in 0001_init.sql. This keeps the
-- migration idempotent if the column was ever dropped manually.
alter table public.exercises
  add column if not exists topic_id uuid references public.topics(id);

-- 1) competitors ------------------------------------------------------------

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  avatar_color text default '#7C6AF7',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 2) competitor_progress ----------------------------------------------------

create table if not exists public.competitor_progress (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid references public.competitors(id) on delete cascade,
  training_plan_id uuid references public.training_plans(id) on delete cascade,
  current_topic_id uuid references public.topics(id),
  current_phase_id uuid references public.phases(id),
  status text check (status in ('not_started','in_progress','completed'))
    default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  unique (competitor_id, training_plan_id)
);

create index if not exists competitor_progress_plan_idx
  on public.competitor_progress (training_plan_id, competitor_id);

-- 3) gate_attempts ----------------------------------------------------------
-- `passed` is computed by a BEFORE INSERT/UPDATE trigger that reads
-- `gates.pass_threshold`. Postgres does not permit subqueries inside
-- GENERATED ALWAYS columns, so we settle the flag in trigger-land instead.

create table if not exists public.gate_attempts (
  id uuid primary key default gen_random_uuid(),
  gate_id uuid references public.gates(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete cascade,
  training_plan_id uuid references public.training_plans(id) on delete cascade,
  attempt_date date not null default current_date,
  score integer not null check (score >= 0 and score <= 100),
  passed boolean not null default false,
  notes text,
  file_url text,
  file_name text,
  file_type text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists gate_attempts_lookup_idx
  on public.gate_attempts (gate_id, competitor_id, created_at desc);

create index if not exists gate_attempts_plan_idx
  on public.gate_attempts (training_plan_id);

create or replace function public.set_gate_attempt_passed()
returns trigger
language plpgsql
as $$
declare
  threshold int;
begin
  select pass_threshold into threshold
  from public.gates
  where id = new.gate_id;

  new.passed := threshold is not null and new.score >= threshold;
  return new;
end;
$$;

drop trigger if exists trg_gate_attempts_passed on public.gate_attempts;
create trigger trg_gate_attempts_passed
before insert or update of score, gate_id
on public.gate_attempts
for each row execute function public.set_gate_attempt_passed();

-- 4) RLS --------------------------------------------------------------------

alter table public.competitors enable row level security;
alter table public.competitor_progress enable row level security;
alter table public.gate_attempts enable row level security;

-- competitors: all signed-in users can read, only instructors/admins write.
drop policy if exists "competitors_select" on public.competitors;
create policy "competitors_select" on public.competitors
  for select to authenticated using (true);

drop policy if exists "competitors_insert" on public.competitors;
create policy "competitors_insert" on public.competitors
  for insert to authenticated with check (public.is_instructor());

drop policy if exists "competitors_update" on public.competitors;
create policy "competitors_update" on public.competitors
  for update to authenticated
  using (public.is_instructor())
  with check (public.is_instructor());

drop policy if exists "competitors_delete" on public.competitors;
create policy "competitors_delete" on public.competitors
  for delete to authenticated using (public.is_admin());

-- competitor_progress: all signed-in users can read, instructors/admins write.
drop policy if exists "progress_select" on public.competitor_progress;
create policy "progress_select" on public.competitor_progress
  for select to authenticated using (true);

drop policy if exists "progress_all" on public.competitor_progress;
create policy "progress_all" on public.competitor_progress
  for all to authenticated
  using (public.is_instructor())
  with check (public.is_instructor());

-- gate_attempts: all signed-in users can read, instructors/admins write.
drop policy if exists "attempts_select" on public.gate_attempts;
create policy "attempts_select" on public.gate_attempts
  for select to authenticated using (true);

drop policy if exists "attempts_insert" on public.gate_attempts;
create policy "attempts_insert" on public.gate_attempts
  for insert to authenticated with check (public.is_instructor());

drop policy if exists "attempts_update" on public.gate_attempts;
create policy "attempts_update" on public.gate_attempts
  for update to authenticated
  using (public.is_instructor())
  with check (public.is_instructor());

drop policy if exists "attempts_delete" on public.gate_attempts;
create policy "attempts_delete" on public.gate_attempts
  for delete to authenticated using (public.is_admin());

-- 5) Storage bucket ---------------------------------------------------------
-- Private bucket for gate attempt files (pdf/docx/jpg/png, 20 MB max).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gate-attempts',
  'gate-attempts',
  false,
  20 * 1024 * 1024,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  execute $pol$
    create policy "storage_gate_attempts_rw_authenticated"
    on storage.objects
    for all
    to authenticated
    using (bucket_id = 'gate-attempts')
    with check (bucket_id = 'gate-attempts');
  $pol$;
exception when duplicate_object then
  null;
end $$;

-- 6) Seed the 3 fixed competitors ------------------------------------------

insert into public.competitors (id, full_name, avatar_color) values
  ('f1000000-0000-0000-0000-000000000001', 'Hessa', '#7C6AF7'),
  ('f1000000-0000-0000-0000-000000000002', 'Mai',   '#00a878'),
  ('f1000000-0000-0000-0000-000000000003', 'Hamda', '#3b82f6')
on conflict (id) do update set
  full_name = excluded.full_name,
  avatar_color = excluded.avatar_color;

-- 7) Seed initial progress on Plan 1 (Foundation phase, first block) -------

insert into public.competitor_progress
  (competitor_id, training_plan_id, current_topic_id, current_phase_id, status)
select
  c.id,
  'b1000000-0000-0000-0000-000000000001'::uuid,
  (
    select t.id
    from public.topics t
    where t.phase_id = 'a1000000-0000-0000-0000-000000000001'
    order by t.order_index nulls last, t.created_at
    limit 1
  ),
  'a1000000-0000-0000-0000-000000000001'::uuid,
  'in_progress'
from public.competitors c
where c.id in (
  'f1000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000002',
  'f1000000-0000-0000-0000-000000000003'
)
on conflict (competitor_id, training_plan_id) do nothing;
