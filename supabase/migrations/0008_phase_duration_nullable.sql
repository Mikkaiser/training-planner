-- Phase creation no longer requires a fixed duration at create-time.
alter table public.phases
  alter column duration_weeks drop not null;
