-- Training Planner: initial schema + RLS + storage buckets

create extension if not exists "pgcrypto";

-- Helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.is_instructor()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','instructor')
  );
$$;

-- Profiles (mirror of auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null check (role in ('admin','instructor')) default 'instructor',
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Any signed-in user can read all profiles (for "created by" display + admin user mgmt UI)
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

-- Users can insert their own profile row (normally handled by trigger).
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Users can update their own display fields (but not elevate role).
create policy "profiles_update_own_display"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

-- Admins can update any profile (including role).
create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'instructor',
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Domain tables
create table if not exists public.subcompetences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text,
  icon text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create unique index if not exists subcompetences_name_uq
on public.subcompetences (name);

create table if not exists public.phases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  order_index integer,
  duration_weeks integer,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create unique index if not exists phases_name_uq
on public.phases (name);

create table if not exists public.phase_subcompetences (
  phase_id uuid references public.phases(id) on delete cascade,
  subcompetence_id uuid references public.subcompetences(id) on delete cascade,
  primary key (phase_id, subcompetence_id)
);

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text check (status in ('draft','active','completed')) default 'draft',
  start_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create unique index if not exists training_plans_name_uq
on public.training_plans (name);

create table if not exists public.training_plan_phases (
  training_plan_id uuid references public.training_plans(id) on delete cascade,
  phase_id uuid references public.phases(id) on delete cascade,
  order_index integer,
  start_offset_weeks integer,
  primary key (training_plan_id, phase_id)
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid references public.phases(id) on delete cascade,
  subcompetence_id uuid references public.subcompetences(id),
  name text not null,
  description text,
  order_index integer,
  created_at timestamptz default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.topics(id) on delete cascade,
  subcompetence_id uuid references public.subcompetences(id),
  title text not null,
  description text,
  difficulty text check (difficulty in ('foundation','intermediate','advanced')),
  file_url text,
  file_name text,
  file_type text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.gates (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid references public.phases(id) on delete cascade,
  name text not null,
  description text,
  gate_type text check (gate_type in ('phase_gate','block_gate')),
  pass_threshold integer,
  created_at timestamptz default now()
);

create table if not exists public.gate_assessments (
  id uuid primary key default gen_random_uuid(),
  gate_id uuid references public.gates(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  file_name text,
  file_type text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- RLS
alter table public.subcompetences enable row level security;
alter table public.phases enable row level security;
alter table public.phase_subcompetences enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_plan_phases enable row level security;
alter table public.topics enable row level security;
alter table public.exercises enable row level security;
alter table public.gates enable row level security;
alter table public.gate_assessments enable row level security;

-- Select: instructors + admins can view everything
create policy "select_authenticated" on public.subcompetences for select to authenticated using (true);
create policy "select_authenticated" on public.phases for select to authenticated using (true);
create policy "select_authenticated" on public.phase_subcompetences for select to authenticated using (true);
create policy "select_authenticated" on public.training_plans for select to authenticated using (true);
create policy "select_authenticated" on public.training_plan_phases for select to authenticated using (true);
create policy "select_authenticated" on public.topics for select to authenticated using (true);
create policy "select_authenticated" on public.exercises for select to authenticated using (true);
create policy "select_authenticated" on public.gates for select to authenticated using (true);
create policy "select_authenticated" on public.gate_assessments for select to authenticated using (true);

-- Insert/update: instructors + admins
create policy "ins_upd_instructor" on public.subcompetences
for insert to authenticated with check (public.is_instructor());
create policy "upd_instructor" on public.subcompetences
for update to authenticated using (public.is_instructor()) with check (public.is_instructor());

create policy "ins_upd_instructor" on public.phases
for insert to authenticated with check (public.is_instructor());
create policy "upd_instructor" on public.phases
for update to authenticated using (public.is_instructor()) with check (public.is_instructor());

create policy "ins_upd_instructor" on public.phase_subcompetences
for insert to authenticated with check (public.is_instructor());
create policy "del_instructor" on public.phase_subcompetences
for delete to authenticated using (public.is_instructor());

create policy "ins_upd_instructor" on public.training_plans
for insert to authenticated with check (public.is_instructor());
create policy "upd_instructor" on public.training_plans
for update to authenticated using (public.is_instructor()) with check (public.is_instructor());

create policy "ins_upd_instructor" on public.training_plan_phases
for insert to authenticated with check (public.is_instructor());
create policy "upd_instructor" on public.training_plan_phases
for update to authenticated using (public.is_instructor()) with check (public.is_instructor());
create policy "del_instructor" on public.training_plan_phases
for delete to authenticated using (public.is_instructor());

create policy "ins_upd_instructor" on public.topics
for insert to authenticated with check (public.is_instructor());
create policy "upd_instructor" on public.topics
for update to authenticated using (public.is_instructor()) with check (public.is_instructor());
create policy "del_instructor" on public.topics
for delete to authenticated using (public.is_instructor());

create policy "ins_upd_instructor" on public.exercises
for insert to authenticated with check (public.is_instructor());
create policy "upd_instructor" on public.exercises
for update to authenticated using (public.is_instructor()) with check (public.is_instructor());

create policy "ins_upd_instructor" on public.gates
for insert to authenticated with check (public.is_instructor());
create policy "upd_instructor" on public.gates
for update to authenticated using (public.is_instructor()) with check (public.is_instructor());
create policy "del_instructor" on public.gates
for delete to authenticated using (public.is_instructor());

create policy "ins_upd_instructor" on public.gate_assessments
for insert to authenticated with check (public.is_instructor());
create policy "upd_instructor" on public.gate_assessments
for update to authenticated using (public.is_instructor()) with check (public.is_instructor());
create policy "del_instructor" on public.gate_assessments
for delete to authenticated using (public.is_instructor());

-- Deletes: admin only for core entities (subcompetences/phases/plans/exercises)
create policy "del_admin" on public.subcompetences for delete to authenticated using (public.is_admin());
create policy "del_admin" on public.phases for delete to authenticated using (public.is_admin());
create policy "del_admin" on public.training_plans for delete to authenticated using (public.is_admin());
create policy "del_admin" on public.exercises for delete to authenticated using (public.is_admin());

-- Storage buckets (public read, authenticated write controlled by bucket policies)
insert into storage.buckets (id, name, public)
values
  ('exercises', 'exercises', true),
  ('gate-assessments', 'gate-assessments', true)
on conflict (id) do nothing;

-- Storage object policies (authenticated users can manage files in the two buckets)
do $$
begin
  -- Public read is handled by bucket public=true. These policies cover writes.
  execute $pol$
    create policy "storage_exercises_write_authenticated"
    on storage.objects
    for all
    to authenticated
    using (bucket_id = 'exercises')
    with check (bucket_id = 'exercises');
  $pol$;
exception when duplicate_object then
  null;
end $$;

do $$
begin
  execute $pol$
    create policy "storage_gate_assessments_write_authenticated"
    on storage.objects
    for all
    to authenticated
    using (bucket_id = 'gate-assessments')
    with check (bucket_id = 'gate-assessments');
  $pol$;
exception when duplicate_object then
  null;
end $$;

