-- Exercise categories and per-competitor exercise completions.
-- This migration extends the existing schema without renaming or altering
-- existing tables beyond adding a nullable FK on exercises.

-- 1) Exercise category library ---------------------------------------------------
create table if not exists public.exercise_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create index if not exists exercise_categories_order_idx
  on public.exercise_categories (order_index, created_at);

-- 2) Topic/block to category assignment -----------------------------------------
create table if not exists public.topic_exercise_categories (
  topic_id uuid references public.topics(id) on delete cascade,
  exercise_category_id uuid references public.exercise_categories(id) on delete cascade,
  primary key (topic_id, exercise_category_id)
);

create index if not exists topic_exercise_categories_category_idx
  on public.topic_exercise_categories (exercise_category_id, topic_id);

-- 3) Exercises table extension ---------------------------------------------------
alter table public.exercises
  add column if not exists exercise_category_id uuid
  references public.exercise_categories(id) on delete set null;

create index if not exists exercises_exercise_category_id_idx
  on public.exercises (exercise_category_id);

-- 4) Per-exercise completion -----------------------------------------------------
create table if not exists public.exercise_completions (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid references public.exercises(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete cascade,
  plan_id uuid references public.training_plans(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  marked_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (exercise_id, competitor_id, plan_id)
);

create index if not exists exercise_completions_plan_competitor_idx
  on public.exercise_completions (plan_id, competitor_id);

create index if not exists exercise_completions_exercise_idx
  on public.exercise_completions (exercise_id);

-- 5) RLS ------------------------------------------------------------------------
alter table public.exercise_categories enable row level security;
alter table public.topic_exercise_categories enable row level security;
alter table public.exercise_completions enable row level security;

-- exercise_categories: authenticated users can read all
drop policy if exists "exercise_categories_select_authenticated" on public.exercise_categories;
create policy "exercise_categories_select_authenticated"
on public.exercise_categories
for select to authenticated
using (true);

-- exercise_categories: instructors/admins can insert/update
drop policy if exists "exercise_categories_insert_instructor" on public.exercise_categories;
create policy "exercise_categories_insert_instructor"
on public.exercise_categories
for insert to authenticated
with check (public.is_instructor());

drop policy if exists "exercise_categories_update_instructor" on public.exercise_categories;
create policy "exercise_categories_update_instructor"
on public.exercise_categories
for update to authenticated
using (public.is_instructor())
with check (public.is_instructor());

-- topic_exercise_categories: authenticated users can read all
drop policy if exists "topic_exercise_categories_select_authenticated" on public.topic_exercise_categories;
create policy "topic_exercise_categories_select_authenticated"
on public.topic_exercise_categories
for select to authenticated
using (true);

-- topic_exercise_categories: instructors/admins can insert/delete
drop policy if exists "topic_exercise_categories_insert_instructor" on public.topic_exercise_categories;
create policy "topic_exercise_categories_insert_instructor"
on public.topic_exercise_categories
for insert to authenticated
with check (public.is_instructor());

drop policy if exists "topic_exercise_categories_delete_instructor" on public.topic_exercise_categories;
create policy "topic_exercise_categories_delete_instructor"
on public.topic_exercise_categories
for delete to authenticated
using (public.is_instructor());

-- exercise_completions: authenticated users can read all
drop policy if exists "exercise_completions_select_authenticated" on public.exercise_completions;
create policy "exercise_completions_select_authenticated"
on public.exercise_completions
for select to authenticated
using (true);

-- exercise_completions: instructors can insert/update for plans they own;
-- admins can always insert/update.
drop policy if exists "exercise_completions_insert_instructor_owned_plan" on public.exercise_completions;
create policy "exercise_completions_insert_instructor_owned_plan"
on public.exercise_completions
for insert to authenticated
with check (
  public.is_admin()
  or (
    public.is_instructor()
    and exists (
      select 1
      from public.training_plans tp
      where tp.id = plan_id
        and tp.created_by = auth.uid()
    )
  )
);

drop policy if exists "exercise_completions_update_instructor_owned_plan" on public.exercise_completions;
create policy "exercise_completions_update_instructor_owned_plan"
on public.exercise_completions
for update to authenticated
using (
  public.is_admin()
  or (
    public.is_instructor()
    and exists (
      select 1
      from public.training_plans tp
      where tp.id = plan_id
        and tp.created_by = auth.uid()
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_instructor()
    and exists (
      select 1
      from public.training_plans tp
      where tp.id = plan_id
        and tp.created_by = auth.uid()
    )
  )
);
