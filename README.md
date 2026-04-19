## Training Planner

Next.js 14 (App Router) + TypeScript + Supabase + Tailwind + shadcn/ui.

### Local setup

Create your env file:

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then run:

```bash
pnpm install
pnpm dev
```

### Supabase CLI (Linux)

Install the Supabase CLI:

```bash
# Option 1 — official install script
curl -fsSL https://supabase.com/install.sh | sh

# Option 2 — Homebrew (Linuxbrew)
brew install supabase/tap/supabase

# Option 3 — npm
npm install -g supabase
```

Verify the installation:

```bash
supabase --version
```

### Supabase database setup

This repo includes:
- `supabase/migrations/0001_init.sql`: tables + RLS + storage buckets
- `supabase/seed.sql`: the 4 macro-subcompetences + a sample plan/phases/gate

**Using the Supabase CLI (recommended):**

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
supabase db seed
```

**Using the Dashboard SQL Editor (alternative):**

Apply in this order:
1. Run `supabase/migrations/0001_init.sql`
2. Run `supabase/seed.sql`

### Roles

New users default to `instructor` via an `auth.users` trigger that creates a row in `public.profiles`.

To make the first user an admin, update their profile role in SQL:

```sql
update public.profiles set role = 'admin' where id = '<user_uuid>';
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
