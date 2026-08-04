## Training Planner

WorldSkills Software Development training planner: plans, phases, blocks and gates.

Next.js 14 (App Router) + TypeScript + Postgres + Auth.js + Tailwind.

### Local development (Docker, recommended)

Brings up Postgres and the Next.js dev server with hot reload:

```bash
cp .env.example .env.local     # fill in AUTH_SECRET and the Google credentials
docker compose -f docker-compose.dev.yml up
```

App on http://localhost:3000, database on `127.0.0.1:5437`.

`docker-compose.dev.yml` sets `DATABASE_URL`, `AUTH_URL` and `NEXT_PUBLIC_APP_URL`
itself, overriding `.env.local`, so a stray production value in that file cannot
point your dev server at the live database.

Apply the schema with the migration runner:

```bash
pnpm migrate
```

It records each file in `schema_migrations`, runs it in a transaction, and is
safe to re-run — it skips whatever is already applied. `db/migrations/` is
deliberately **not** mounted into the Postgres entrypoint: that hook only fires
on the first boot of an empty volume, so having both would mean two mechanisms
applying the same files with no shared record of what ran.

To start over: `docker compose -f docker-compose.dev.yml down -v`, then
`pnpm migrate` again. That wipes the dev database.

Generate a secret with:

```bash
openssl rand -base64 33
```

Google OAuth needs `http://localhost:3000/api/auth/callback/google` in the
authorized redirect URIs of your OAuth client, alongside the production one.

#### Object storage

Dev uses a separate MinIO bucket, `training-planner-media-dev`, with its own
credentials scoped to that bucket alone. The bucket name and endpoint are pinned
in `docker-compose.dev.yml`, so only `S3_ACCESS_KEY` and `S3_SECRET_KEY` belong
in `.env.local`. Dev credentials are denied on the production bucket and vice
versa, so a mistake in dev cannot reach live objects.

### Local development (without Docker)

Needs a Postgres 17 instance you supply yourself:

```bash
pnpm install
pnpm migrate
pnpm dev
```

### Database

| Path | Purpose |
|------|---------|
| `db/migrations/` | Schema, applied in filename order. Safe on any environment. |
| `db/seeds/` | One-off, environment-specific data. Not applied automatically. |
| `supabase/migrations/` | Historical, from before the Supabase migration. Kept for reference only, do not run. |

`pnpm migrate` is the only way migrations are applied, in every environment.
The production deploy runs it in a one-off container before the web container is
recreated — new code against an old schema fails on every request, whereas old
code against a newly migrated schema keeps working for the seconds until it is
replaced.

### Authentication

Auth.js (NextAuth v5) with the Google provider and `@auth/pg-adapter`.

Sessions use the JWT strategy so `middleware.ts` can verify them at the edge
without a database round trip. The `sessions` table exists but stays empty
unless that strategy changes.

**There is no row level security.** Ownership is enforced in application code:
every query and every server action filters or joins on `instructor_id`. When
adding a data-access path, carry that check through, or you will expose other
instructors' plans. `scripts/smoke.ts` asserts the isolation holds.

### Tests

Unit tests cover the pure logic — plan derivation, diagram geometry, the upload
allowlist, view parsing. No database, no network:

```bash
pnpm test
```

Anything needing a database, a browser or the bucket runs separately. Start
`pnpm dev` and the dev database first:

```bash
pnpm verify             # all four below
pnpm verify:s3          # presigned upload/download round-trip against MinIO
pnpm verify:flows       # drives the real app in a browser and asserts outcomes
pnpm verify:responsive  # no horizontal overflow across routes x widths
pnpm verify:orphans     # bucket objects no row points at (--prune to remove)
pnpm verify:capture     # screenshots every view into .verify/ (--mobile, --all)
pnpm verify:scheme <f>  # parses a marking scheme workbook in place and prints what it found
```

`verify:flows` and `verify:capture` authenticate by signing an Auth.js session
cookie with `AUTH_SECRET`. That is test-side only — the application ships no
development login bypass.

To check the production build compiles while dev is running, use `pnpm
build:check` — it writes to `.next-check` instead of the `.next` that `pnpm dev`
serves from. Running plain `pnpm build` alongside dev leaves dev returning 404s
for every chunk, and the browser suites then fail in ways that look like real
bugs.

### Smoke test

Runs against a live database and cleans up after itself:

```bash
pnpm smoke
```

Covers CRUD, cascade deletes, the numeric and timestamp casts, and ownership
isolation between two users.

### Production

| File | Role |
|------|------|
| `docker-compose.db.yml` | Postgres container, loopback port 5436 |
| `docker-compose.yml` | Next.js app, built image, behind the nginx proxy |

```bash
docker compose -f docker-compose.db.yml --env-file .env.db up -d
docker compose up -d --build
```

`NEXT_PUBLIC_*` values are baked in at build time, so changing them requires a
rebuild rather than a restart.
