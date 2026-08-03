-- One-off seed, already applied to production on 2026-08-03.
-- Links the Google identity carried over from Supabase to the migrated user so
-- the first Auth.js sign-in resolves to the existing row instead of creating a
-- duplicate. Kept out of db/migrations/ on purpose: it is environment-specific
-- data, and running it against an empty database raises a foreign key error.
-- Safe to re-run, and a no-op if the user is absent.

update public.users
   set "emailVerified" = timestamptz '2026-04-19 07:43:28.244888+00'
 where email = 'mikkaiser.ribeiro@gmail.com'
   and "emailVerified" is null;

insert into public.accounts ("userId", type, provider, "providerAccountId")
select u.id, 'oidc', 'google', '105291050154695449115'
  from public.users u
 where u.id = '3bbd739e-8c94-492b-80df-a8f61dde50cb'
on conflict (provider, "providerAccountId") do nothing;
