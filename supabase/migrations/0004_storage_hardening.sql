-- Storage hardening: lock down all three buckets to private, pdf/docx/zip,
-- 20MB. Add optional PDF preview to exercises. Wipe stale exercise data
-- (previously written with full public URLs back when the bucket was public).

-- 1) Lock down all three buckets.
update storage.buckets
set public = false,
    file_size_limit = 20 * 1024 * 1024,
    allowed_mime_types = array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed'
    ]
where id in ('exercises', 'gate-assessments', 'gate-attempts');

-- 2) Ensure `exercises` has an authenticated RW storage policy (bucket was
-- public in 0001_init.sql so no write policy was needed).
do $$
begin
  execute $pol$
    create policy "storage_exercises_rw_authenticated"
    on storage.objects
    for all
    to authenticated
    using (bucket_id = 'exercises')
    with check (bucket_id = 'exercises');
  $pol$;
exception when duplicate_object then
  null;
end $$;

-- 3) Wipe existing exercise data (rows referenced full public URLs, which
-- are no longer usable now that the bucket is private).
truncate table public.exercises;

-- Note: orphaned objects in the `exercises` bucket are left untouched —
-- Supabase blocks direct DELETE on storage.objects (use the Storage API).
-- New uploads use timestamped paths (buildObjectPath) so collisions are
-- impossible in practice.

-- 4) Optional PDF preview for an exercise (separate storage object, pdf
-- only; enforced client-side by the FileUpload component).
alter table public.exercises
  add column if not exists preview_url text,
  add column if not exists preview_file_name text;
