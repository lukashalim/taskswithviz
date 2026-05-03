# Task Tracker

Next.js app with Supabase Auth (Google sign-in), Postgres tasks with RLS, and Realtime updates. UI uses Tailwind CSS and shadcn/ui.

## Setup

1. Copy [`.env.example`](.env.example) to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon JWT from the Supabase dashboard is fine)

2. In the Supabase dashboard → **Authentication** → **URL configuration**, add redirect URLs:

   - `http://localhost:3000/auth/callback` (dev)
   - Your production origin + `/auth/callback`

3. **Google sign-in**

   - Supabase → **Authentication** → **Providers** → **Google**: enable and add OAuth **Client ID** and **Client secret** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - In the Google OAuth client, set **Authorized redirect URI** to:  
     `https://<your-project-ref>.supabase.co/auth/v1/callback`  
     (same host as `NEXT_PUBLIC_SUPABASE_URL`.)

4. Database:

   - `public.tasks` with RLS (see your existing setup). Realtime publication should include `public.tasks`. Optional column **`percent_done`** (0–100, nullable) is added by [`supabase/migrations/20260202140000_tasks_percent_done.sql`](supabase/migrations/20260202140000_tasks_percent_done.sql) for work-vs-time rings in the UI.
   - **Progress updates:** apply [`supabase/migrations/20260202120000_task_updates.sql`](supabase/migrations/20260202120000_task_updates.sql) using either:
     - **CLI:** add `DATABASE_URL` to `.env.local` (Supabase → **Project Settings** → **Database** → **Connection string** → URI; URL-encode characters in the password). Then run `npm run db:push`.
     - **SQL Editor:** paste and run the migration file in the [SQL Editor](https://supabase.com/dashboard/project/_/sql/new) (replace `_` with your project ref). The migration adds `task_updates` to `supabase_realtime` when possible.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Features

- KPI cards: total tasks, percent complete, overdue count (overdue = past due date and not complete)
- Task CRUD with grouped sections by visual status
- **Task detail page** (`/dashboard/tasks/[id]`): full description, edit task, and an append-only **progress log** with realtime sync
- Instant UI updates via Supabase Realtime `postgres_changes`
