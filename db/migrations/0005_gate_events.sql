-- Append-only history of gate outcomes.
--
-- gates.status only holds the current value, so the list view's stat strip had
-- no way to answer "blocks completed in the last 30 days" or "gates passed
-- first try" without inventing numbers. Every pass/fail appends a row here.

create table public.gate_events (
  id         uuid primary key default gen_random_uuid(),
  gate_id    uuid not null references public.gates (id) on delete cascade,
  plan_id    uuid not null references public.training_plans (id) on delete cascade,
  status     public.gate_status not null,
  changed_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.gate_events (plan_id, created_at desc);
create index on public.gate_events (gate_id, created_at);

-- Backfill: gates that were already decided before this table existed get one
-- synthetic event, timestamped from the gate row so the 30-day window and the
-- first-try calculation have something truthful to read. Gates still pending
-- have no outcome yet and so get no event.
insert into public.gate_events (gate_id, plan_id, status, created_at)
select g.id, g.plan_id, g.status, g.created_at
  from public.gates g
 where g.status <> 'pending';
