-- Drop unused scheduling fields.
-- The UI no longer requires training plan start dates or phase durations.

alter table public.training_plans
  drop column if exists start_date;

alter table public.phases
  drop column if exists duration_weeks;

