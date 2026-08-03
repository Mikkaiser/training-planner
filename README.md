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

The migrations in `db/migrations/` are mounted into the Postgres entrypoint and
applied automatically the first time the volume is created. They do not re-run
afterwards. To pick up a changed migration, recreate the volume:

```bash
docker compose -f docker-compose.dev.yml down -v
```

That wipes the dev database.

Generate a secret with:

```bash
openssl rand -base64 33
```

Google OAuth needs `http://localhost:3000/api/auth/callback/google` in the
authorized redirect URIs of your OAuth client, alongside the production one.

### Local development (without Docker)

Needs a Postgres 17 instance you supply yourself:

```bash
pnpm install
psql "$DATABASE_URL" -f db/migrations/0001_init.sql
psql "$DATABASE_URL" -f db/migrations/0002_authjs.sql
pnpm dev
```

### Database

| Path | Purpose |
|------|---------|
| `db/migrations/` | Schema, applied in filename order. Safe on any environment. |
| `db/seeds/` | One-off, environment-specific data. Not applied automatically. |
| `supabase/migrations/` | Historical, from before the Supabase migration. Kept for reference only, do not run. |

There is no migration runner. Files are applied manually in production and by
the Postgres entrypoint in dev.

### Authentication

Auth.js (NextAuth v5) with the Google provider and `@auth/pg-adapter`.

Sessions use the JWT strategy so `middleware.ts` can verify them at the edge
without a database round trip. The `sessions` table exists but stays empty
unless that strategy changes.

**There is no row level security.** Ownership is enforced in application code:
every query and every server action filters or joins on `instructor_id`. When
adding a data-access path, carry that check through, or you will expose other
instructors' plans. `scripts/smoke.ts` asserts the isolation holds.

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
