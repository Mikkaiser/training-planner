-- Competitor-centric training extensions.
-- Adds competitor metadata, plan ownership fields, participation lifecycle,
-- and bootstraps the existing seeded competitors on Phase 1.

-- 1) competitors ----------------------------------------------------------------
alter table public.competitors
  add column if not exists email text;

alter table public.competitors
  add column if not exists notes text;

alter table public.competitors
  add column if not exists active_plan_id uuid references public.training_plans(id) on delete set null;

alter table public.competitors
  add column if not exists archived boolean default false;

-- 2) training_plans --------------------------------------------------------------
alter table public.training_plans
  add column if not exists plan_type text
    check (plan_type in ('shared', 'personal'))
    default 'shared';

alter table public.training_plans
  add column if not exists owner_competitor_id uuid
    references public.competitors(id) on delete set null;

update public.training_plans
set plan_type = 'shared'
where owner_competitor_id is null;

-- 3) competitor_progress ---------------------------------------------------------
alter table public.competitor_progress
  add column if not exists participation_status text
    check (participation_status in ('active', 'archived'))
    default 'active';

-- 4) seed initial progress for existing competitors -----------------------------
insert into public.competitor_progress (
  competitor_id,
  training_plan_id,
  current_phase_id,
  current_topic_id,
  status,
  participation_status
)
values
  (
    'f1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'in_progress',
    'active'
  ),
  (
    'f1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'in_progress',
    'active'
  ),
  (
    'f1000000-0000-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'in_progress',
    'active'
  )
on conflict (competitor_id, training_plan_id) do update
set
  current_phase_id = excluded.current_phase_id,
  current_topic_id = excluded.current_topic_id,
  status = excluded.status,
  participation_status = excluded.participation_status;

-- 5) set active plan for seeded competitors -------------------------------------
update public.competitors
set active_plan_id = 'b1000000-0000-0000-0000-000000000001'
where id in (
  'f1000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000002',
  'f1000000-0000-0000-0000-000000000003'
);

-- 6) RLS ------------------------------------------------------------------------
alter table public.competitors enable row level security;
