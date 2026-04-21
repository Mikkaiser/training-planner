-- Relax the delete policy on training_plans so that:
--   * admins can delete any plan, and
--   * instructors can delete plans they created (created_by = auth.uid()).
--
-- Previously only admins could delete (policy "del_admin" added in 0001_init.sql),
-- which silently blocked instructor deletes — PostgREST reports no error and 0
-- affected rows, making the plans list appear to delete rows that actually stay
-- in the database.

drop policy if exists "del_admin" on public.training_plans;

create policy "del_admin_or_owner_instructor"
on public.training_plans
for delete
to authenticated
using (
  public.is_admin()
  or (public.is_instructor() and created_by = auth.uid())
);
