-- Training Planner seed data (idempotent)
-- Run AFTER applying `supabase/migrations/0001_init.sql`.

create extension if not exists "pgcrypto";

-- 1) Upgrade mikkaiser.ribeiro@gmail.com to admin (run after first login)
do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where email = 'mikkaiser.ribeiro@gmail.com'
  limit 1;

  if target_user_id is not null then
    update public.profiles
    set role = 'admin'
    where id = target_user_id;
  end if;
end $$;

-- 2) Seed the 4 macro subcompetences
insert into public.subcompetences (id, name, description, color, icon)
values
  (gen_random_uuid(), 'Analysis & Design', 'UML, ERD, use cases, wireframes, system architecture', '#7C6AF7', 'PenTool'),
  (gen_random_uuid(), 'Development', 'WinForms, MAUI, ASP.NET Core, EF Core, SQL Server, JWT', '#00d4ff', 'Code2'),
  (gen_random_uuid(), 'Testing', 'Unit testing, integration testing, xUnit, test case design', '#00a878', 'ShieldCheck'),
  (gen_random_uuid(), 'Transversal', 'Documentation, communication, time management, professionalism', '#FB923C', 'Layers')
on conflict (name) do update
set
  description = excluded.description,
  color = excluded.color,
  icon = excluded.icon;

-- 3) Seed 2 sample phases (fixed IDs)
insert into public.phases (id, name, description, order_index, duration_weeks)
values
  ('a1000000-0000-0000-0000-000000000001', 'Foundation', 'Core fundamentals: OOP, SQL basics, WinForms intro, UML basics', 1, 4),
  ('a1000000-0000-0000-0000-000000000002', 'Intermediate', 'API development, EF Core, MAUI intro, testing fundamentals', 2, 6)
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  order_index = excluded.order_index,
  duration_weeks = excluded.duration_weeks;

-- 4) Associate subcompetences to phases
insert into public.phase_subcompetences (phase_id, subcompetence_id)
select 'a1000000-0000-0000-0000-000000000001', id
from public.subcompetences
where name in ('Analysis & Design', 'Development')
on conflict do nothing;

insert into public.phase_subcompetences (phase_id, subcompetence_id)
select 'a1000000-0000-0000-0000-000000000002', id
from public.subcompetences
where name in ('Development', 'Testing', 'Transversal')
on conflict do nothing;

-- 5) Seed 1 sample training plan (fixed ID)
insert into public.training_plans (id, name, description, status, start_date)
values
  ('b1000000-0000-0000-0000-000000000001', 'Phase 1 — Foundation Track', 'Initial training plan for new competitors starting from scratch', 'active', current_date)
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  start_date = excluded.start_date;

-- 6) Associate phases to the training plan
insert into public.training_plan_phases (training_plan_id, phase_id, order_index, start_offset_weeks)
values
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1, 0),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 2, 4)
on conflict do nothing;

-- 7) Seed a gate at the end of the Foundation phase
insert into public.gates (id, phase_id, name, description, gate_type, pass_threshold)
select
  gen_random_uuid(),
  'a1000000-0000-0000-0000-000000000001',
  'Foundation Gate',
  'Competitor must demonstrate core OOP, basic SQL, and WinForms form completion',
  'phase_gate',
  70
where not exists (
  select 1
  from public.gates g
  where g.phase_id = 'a1000000-0000-0000-0000-000000000001'
    and g.name = 'Foundation Gate'
);

-- 8) Seed sample topics for Foundation phase
insert into public.topics (phase_id, subcompetence_id, name, description, order_index)
select
  'a1000000-0000-0000-0000-000000000001',
  id,
  'OOP Fundamentals',
  'Classes, inheritance, polymorphism, encapsulation in C#',
  1
from public.subcompetences
where name = 'Development'
  and not exists (
    select 1
    from public.topics t
    where t.phase_id = 'a1000000-0000-0000-0000-000000000001'
      and t.name = 'OOP Fundamentals'
  );

insert into public.topics (phase_id, subcompetence_id, name, description, order_index)
select
  'a1000000-0000-0000-0000-000000000001',
  id,
  'Use Case Modelling',
  'Actors, use case diagrams, include/extend relationships',
  2
from public.subcompetences
where name = 'Analysis & Design'
  and not exists (
    select 1
    from public.topics t
    where t.phase_id = 'a1000000-0000-0000-0000-000000000001'
      and t.name = 'Use Case Modelling'
  );

insert into public.topics (phase_id, subcompetence_id, name, description, order_index)
select
  'a1000000-0000-0000-0000-000000000001',
  id,
  'SQL Server Basics',
  'DDL, DML, SELECT, JOINs, basic stored procedures',
  3
from public.subcompetences
where name = 'Development'
  and not exists (
    select 1
    from public.topics t
    where t.phase_id = 'a1000000-0000-0000-0000-000000000001'
      and t.name = 'SQL Server Basics'
  );

