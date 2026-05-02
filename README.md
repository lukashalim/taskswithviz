# Task Tracker

Next.js app with Supabase Auth (password + magic link), Postgres tasks with RLS, and Realtime updates. UI uses Tailwind CSS and shadcn/ui.

## Setup

1. Copy [`.env.example`](.env.example) to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon JWT from the Supabase dashboard is fine)

2. In the Supabase dashboard → **Authentication** → **URL configuration**, add redirect URLs:

   - `http://localhost:3000/auth/callback` (dev)
   - Your production origin + `/auth/callback`

3. Enable **Email** provider. Magic link uses `signInWithOtp`; password uses `signInWithPassword` / `signUp`.

4. Database: the app expects a `public.tasks` table with RLS (created via Supabase MCP / SQL in this project). Realtime publication must include `public.tasks`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Features

- KPI cards: total tasks, percent complete, overdue count (overdue = past due date and not complete)
- Task CRUD with grouped sections by visual status
- Instant UI updates via Supabase Realtime `postgres_changes`
