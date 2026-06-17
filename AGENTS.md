# Training Planner — Project Guide

A curriculum / training-plan builder for instructors. An instructor creates a **plan** for a
student, structures it into ordered **phases**, fills phases with learning **blocks**, and places
**gates** (checkpoints) after blocks. Progress is driven by passing gates.

This file is the source of truth for how the project is built and how code should be written.
`CLAUDE.md` imports it via `@AGENTS.md`.

---

## Tech stack

- **Next.js 14.2** (App Router) + **React 18.3** + **TypeScript 5** (strict)
- **Supabase** — Postgres + Auth (Google OAuth), via `@supabase/ssr` and `@supabase/supabase-js`
- **Tailwind CSS 3.4** + custom CSS variables in `globals.css`; `cn()` (clsx + tailwind-merge) helper
- **lucide-react** icons
- **pnpm** package manager (`pnpm-lock.yaml` is committed)

Several libraries are listed in `package.json` but **not yet used** in app code — treat them as
sanctioned choices for future work, not as existing patterns to imitate:
`@tanstack/react-query`, `react-hook-form` + `zod` + `@hookform/resolvers`, `@dnd-kit/*`,
`framer-motion`, `sonner`, `shadcn`, `@base-ui/react`, `date-fns`, `class-variance-authority`.

---

## Environment & build (IMPORTANT — read before installing)

This repo lives on the **WSL (Ubuntu) ext4 filesystem**, accessed from Windows as the `U:` drive
(`\\wsl.localhost\Ubuntu\...`). Two hard rules follow:

1. **Install and build *inside* WSL, never with Windows Node/pnpm.** pnpm's symlinked
   `node_modules` and `.pnpm` store cannot be created or read across the Windows↔WSL 9p boundary
   (you get `EPERM`/`EISDIR`/`Input/output error`). Running `pnpm.exe` against the `U:` path will
   corrupt `node_modules`.
2. To remove a corrupted `node_modules`, only native WSL `rm -rf` works (git-bash and Windows
   `rmdir`/`del` fail on the cross-boundary symlinks).

### Toolchain in WSL
- Node is provided by **nvm**; use **Node 22** (`nvm install 22` / `nvm use 22`). pnpm 11 requires
  Node ≥ 22.13 (it uses `node:sqlite`). Node 20 will crash pnpm.
- pnpm is run via **corepack** (`corepack enable`, then `corepack pnpm ...`). Current pnpm is 11.7.

### Running commands from the Windows session
Use the helper `scripts/wsl-run.sh`, which loads nvm + Node 22, sets `CI=true`, and `cd`s into the
project, then execs whatever you pass:

```powershell
wsl --cd /home/mikkaiser/0_projects/training-planner -e bash scripts/wsl-run.sh corepack pnpm install
wsl --cd /home/mikkaiser/0_projects/training-planner -e bash scripts/wsl-run.sh corepack pnpm build
```

Notes:
- Always pass `wsl --cd <linux path>` so the launcher doesn't choke translating the `U:` cwd.
- For long/garbled output, redirect to a file in WSL (`> /tmp/x.log 2>&1`) and read it back.

### pnpm build-script approval (`pnpm-workspace.yaml`)
pnpm 11 **removed `onlyBuiltDependencies`**. Build scripts are now gated by **`allowBuilds`** (a
package → boolean map) with `strictDepBuilds: true` by default, so unreviewed build scripts make
`pnpm install` exit non-zero — which in turn blocks `pnpm build` (it runs a deps check first).
Approved builds live in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  esbuild: true        # used by tsx
  sharp: true          # next/image optimization
  supabase: true       # CLI binary download
  unrs-resolver: true  # eslint import resolver native binding
  msw: false           # transitive, not needed
```

If a new dependency's build is ignored, pnpm appends it to this map with a placeholder — set it to
`true`/`false` and reinstall.

### `.npmrc`
`node-linker=hoisted` is set so top-level packages are real directories (helps Windows-side IDE
tooling resolve modules without traversing pnpm symlinks).

---

## Commands

Run all of these through WSL (see above). The npm scripts:

| Script        | Purpose                                                        |
| ------------- | ------------------------------------------------------------- |
| `pnpm dev`    | Next dev server (http://localhost:3000)                       |
| `pnpm build`  | Production build (`next build`) — also runs lint + type check |
| `pnpm start`  | Serve the production build                                     |
| `pnpm lint`   | `next lint`                                                    |
| `pnpm smoke`  | `tsx scripts/smoke.ts` — end-to-end Supabase CRUD/RLS check   |

`pnpm smoke` needs `SUPABASE_SERVICE_ROLE_KEY` and runs a full create→read→cascade-delete cycle
against a throwaway user; use it to validate schema/RLS changes.

---

## Architecture

### Directory layout (`src/`)
```
src/
├── app/                      # App Router
│   ├── layout.tsx            # Root layout, Google fonts, metadata
│   ├── page.tsx              # Home — instructor's plan list (Server Component)
│   ├── login/page.tsx        # Google OAuth login (Client Component)
│   ├── auth/callback/route.ts# OAuth code → session exchange
│   └── plan/[id]/page.tsx    # Plan roadmap detail (Server Component)
├── actions/                  # Server Actions ("use server")
│   ├── auth.ts               # signOut
│   ├── plans.ts              # createPlan, deletePlan
│   ├── phases.ts             # create/update/delete phase
│   └── blocks.ts             # create/update/delete block, updateGateStatus
├── components/
│   ├── layout/TopBar.tsx
│   ├── plan/                 # Feature components (PlanGrid, PlanDetail, PhaseSection, …)
│   └── ui/                   # Reusable primitives (Button, Modal, Tag, StatusBadge, …)
├── hooks/useUser.ts          # Client auth-state hook (onAuthStateChange)
└── lib/
    ├── supabase/client.ts    # Browser client (createBrowserClient)
    ├── supabase/server.ts    # Server client (createServerClient + cookies)
    ├── plan-data.ts          # Server-side read queries (getPlansForCurrentInstructor, …)
    ├── types.ts              # Domain types
    ├── routes.ts             # APP_ROUTES + planDetailRoute()
    └── utils.ts              # cn(), getInitials, getPlanProgress, getCurrentBlock, getGateStatus
```

### Supabase (`supabase/`)
- `migrations/*.sql` — schema, RLS, and grants. Migrations are **timestamp-prefixed**; add new ones
  rather than editing applied ones. (Note: `README.md` references older filenames; the
  `migrations/` directory is authoritative.)
- `.temp/` and `.branches/` are CLI state (linked project ref, versions) — not source.

---

## Data model

Hierarchy, all owned by an instructor (`auth.users`):

```
Plan (training_plans)
 └─ Phase (phases, order_index)
     └─ Block (blocks, order_index)
 └─ Gate (gates, after_block_id)   ← checkpoint placed after a block
```

Types live in `src/lib/types.ts`:
- `Plan` — `title`, `student_name`, `instructor_id`, `created_at`
- `Phase` — `plan_id`, `title`, `order_index`
- `Block` — `phase_id`, `title`, `description`, `verb_level`, `competence_type`, `hours`, `order_index`
- `Gate` — `plan_id`, `after_block_id`, `status`, `hours_threshold`
- `PlanWithPhases = Plan & { phases: (Phase & { blocks: Block[] })[]; gates: Gate[] }` — the
  aggregate read shape used across the UI.

Domain enums (mirror DB enums):
- `VerbLevel`: `Recognize | Apply | Produce | Optimize` (Bloom-style progression)
- `CompetenceType`: `Development | Testing | Analysis & Design | Transversal`
- `GateStatus`: `pending | passed | failed`

Derived logic (in `lib/utils.ts`): progress = % of blocks whose gate is `passed`; "current block" =
first block whose gate is missing/`pending`.

---

## Code patterns & conventions

**Follow these — they are the established patterns in the code.**

- **Server-first.** Pages and reads are Server Components that query Supabase directly (see
  `lib/plan-data.ts`). Add `"use client"` only for interactivity (modals, dropdowns, forms, hooks).
- **Mutations = Server Actions** in `src/actions/*` with `"use server"` at the top. After a
  mutation, call `revalidatePath(...)` for affected routes to refresh the server-rendered cache.
  There is **no react-query** in use; do not introduce client-side data caching without a reason.
- **Server Action error handling** (see `actions/plans.ts`): on a Supabase error, `console.error`
  with a structured object (`code`, `message`, `details`/`hint`), then `throw new Error(<friendly
  message>)`. Never leak raw DB errors to the UI.
- **Optimistic invocation from the client**: call actions inside `useTransition`’s `startTransition`
  and use the `pending` flag to disable inputs; navigate with `next/navigation` `router` afterward.
- **Two Supabase clients, never mixed**: `lib/supabase/server.ts` (Server Components, Actions, Route
  Handlers, middleware) vs `lib/supabase/client.ts` (browser). The server client wraps cookie
  `set` in try/catch because it's a no-op during Server Component render.
- **Routing**: reference routes through `APP_ROUTES` / `planDetailRoute()` in `lib/routes.ts`, not
  hardcoded strings.
- **Imports**: use the `@/*` alias (→ `src/*`). `moduleResolution: bundler`, strict TS.
- **Styling**: Tailwind utility classes composed with `cn(...)`; conditional classes via the same
  helper. Theme via CSS custom properties / component classes (`.tp-*`) in `app/globals.css`.
  Variant components follow `Button.tsx` (explicit variant/size → class mapping).
- **Naming**: PascalCase components and files in `components/`; camelCase functions/vars; snake_case
  for DB columns (matched exactly in `types.ts`).

---

## Auth flow

1. `/login` (client) → `supabase.auth.signInWithOAuth({ provider: "google" })`.
2. Google redirects to `/auth/callback` → `exchangeCodeForSession(code)`, sets cookies, redirects.
3. `middleware.ts` runs on every request (matcher excludes `_next/static`, `_next/image`,
   `favicon.ico`): calls `auth.getUser()`; redirects unauthenticated users to `/login` for any
   route outside `/login` and `/auth`, and redirects authenticated users away from `/login`.
4. `signOut` server action (`actions/auth.ts`) ends the session.
5. Client UI reads the user via `hooks/useUser.ts` (subscribes to `onAuthStateChange`).

New users default to role `instructor` via an `auth.users` trigger that inserts into
`public.profiles` (see `README.md`).

---

## Environment variables

From `.env.example` (local values in `.env.local`, untracked):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; used by `scripts/smoke.ts`)
- `DATABASE_URL`

Never expose the service-role key to the client or import it into anything under `app/`/`components/`.

---

## Design references

`refs/` holds the visual spec (PNG mockups, `TrainingPlanner.html`, `StyleGuide.html`,
`styles.css`). Treat it as read-only design intent when building/adjusting UI.
