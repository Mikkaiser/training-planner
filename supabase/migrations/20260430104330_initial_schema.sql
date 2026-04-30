-- Training Planner — initial schema
-- Order: extensions → enums → tables → trigger → indexes → RLS → policies

create extension if not exists pgcrypto;

-- Enums
create type public.verb_level as enum ('Recognize', 'Apply', 'Produce', 'Optimize');
create type public.competence_type as enum ('Development', 'Testing', 'Analysis & Design', 'Transversal');
create type public.gate_status as enum ('pending', 'passed', 'failed');

-- Profiles (mirrors auth.users)
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Plans
create table public.training_plans (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references auth.users (id) on delete cascade,
  title         text not null,
  student_name  text not null,
  created_at    timestamptz default now() not null
);

-- Phases
create table public.phases (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references public.training_plans (id) on delete cascade,
  title       text not null,
  order_index integer not null default 0,
  created_at  timestamptz default now() not null
);

-- Blocks
create table public.blocks (
  id              uuid primary key default gen_random_uuid(),
  phase_id        uuid not null references public.phases (id) on delete cascade,
  title           text not null,
  description     text not null default '',
  verb_level      public.verb_level not null default 'Recognize',
  competence_type public.competence_type not null default 'Development',
  hours           numeric(5, 1) not null default 1.0,
  order_index     integer not null default 0,
  created_at      timestamptz default now() not null
);

-- Gates
create table public.gates (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid not null references public.training_plans (id) on delete cascade,
  after_block_id  uuid not null references public.blocks (id) on delete cascade,
  status          public.gate_status not null default 'pending',
  hours_threshold numeric(5, 1) not null default 0.0,
  created_at      timestamptz default now() not null
);

-- Profile auto-create on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes
create index on public.training_plans (instructor_id);
create index on public.phases (plan_id, order_index);
create index on public.blocks (phase_id, order_index);
create index on public.gates (plan_id);
create index on public.gates (after_block_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.training_plans enable row level security;
alter table public.phases enable row level security;
alter table public.blocks enable row level security;
alter table public.gates enable row level security;

-- Profiles policies
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Plans policies
create policy "Instructors can read own plans"
  on public.training_plans for select
  using (auth.uid() = instructor_id);

create policy "Instructors can insert own plans"
  on public.training_plans for insert
  with check (auth.uid() = instructor_id);

create policy "Instructors can update own plans"
  on public.training_plans for update
  using (auth.uid() = instructor_id)
  with check (auth.uid() = instructor_id);

create policy "Instructors can delete own plans"
  on public.training_plans for delete
  using (auth.uid() = instructor_id);

-- Phases policies
create policy "Instructors can read own phases"
  on public.phases for select
  using (
    exists (
      select 1 from public.training_plans
      where training_plans.id = phases.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  );

create policy "Instructors can insert own phases"
  on public.phases for insert
  with check (
    exists (
      select 1 from public.training_plans
      where training_plans.id = phases.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  );

create policy "Instructors can update own phases"
  on public.phases for update
  using (
    exists (
      select 1 from public.training_plans
      where training_plans.id = phases.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.training_plans
      where training_plans.id = phases.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  );

create policy "Instructors can delete own phases"
  on public.phases for delete
  using (
    exists (
      select 1 from public.training_plans
      where training_plans.id = phases.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  );

-- Blocks policies
create policy "Instructors can read own blocks"
  on public.blocks for select
  using (
    exists (
      select 1 from public.phases
      join public.training_plans on training_plans.id = phases.plan_id
      where phases.id = blocks.phase_id
        and training_plans.instructor_id = auth.uid()
    )
  );

create policy "Instructors can insert own blocks"
  on public.blocks for insert
  with check (
    exists (
      select 1 from public.phases
      join public.training_plans on training_plans.id = phases.plan_id
      where phases.id = blocks.phase_id
        and training_plans.instructor_id = auth.uid()
    )
  );

create policy "Instructors can update own blocks"
  on public.blocks for update
  using (
    exists (
      select 1 from public.phases
      join public.training_plans on training_plans.id = phases.plan_id
      where phases.id = blocks.phase_id
        and training_plans.instructor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.phases
      join public.training_plans on training_plans.id = phases.plan_id
      where phases.id = blocks.phase_id
        and training_plans.instructor_id = auth.uid()
    )
  );

create policy "Instructors can delete own blocks"
  on public.blocks for delete
  using (
    exists (
      select 1 from public.phases
      join public.training_plans on training_plans.id = phases.plan_id
      where phases.id = blocks.phase_id
        and training_plans.instructor_id = auth.uid()
    )
  );

-- Gates policies
create policy "Instructors can read own gates"
  on public.gates for select
  using (
    exists (
      select 1 from public.training_plans
      where training_plans.id = gates.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  );

create policy "Instructors can insert own gates"
  on public.gates for insert
  with check (
    exists (
      select 1 from public.training_plans
      where training_plans.id = gates.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  );

create policy "Instructors can update own gates"
  on public.gates for update
  using (
    exists (
      select 1 from public.training_plans
      where training_plans.id = gates.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.training_plans
      where training_plans.id = gates.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  );

create policy "Instructors can delete own gates"
  on public.gates for delete
  using (
    exists (
      select 1 from public.training_plans
      where training_plans.id = gates.plan_id
        and training_plans.instructor_id = auth.uid()
    )
  );
