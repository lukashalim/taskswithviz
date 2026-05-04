-- Dedicated work sessions (focus timer) per task; one open session per user enforced in app.

create table if not exists public.task_work_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  constraint task_work_sessions_time_ok check (
    ended_at is null or ended_at >= started_at
  )
);

create index if not exists task_work_sessions_task_started_idx
  on public.task_work_sessions (task_id, started_at desc);

create index if not exists task_work_sessions_user_open_idx
  on public.task_work_sessions (user_id)
  where ended_at is null;

alter table public.task_work_sessions enable row level security;

drop policy if exists "task_work_sessions_select" on public.task_work_sessions;
create policy "task_work_sessions_select"
  on public.task_work_sessions for select
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_work_sessions.task_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "task_work_sessions_insert" on public.task_work_sessions;
create policy "task_work_sessions_insert"
  on public.task_work_sessions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "task_work_sessions_update" on public.task_work_sessions;
create policy "task_work_sessions_update"
  on public.task_work_sessions for update
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_work_sessions.task_id and t.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_work_sessions.task_id and t.user_id = auth.uid()
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'task_work_sessions'
  ) then
    alter publication supabase_realtime add table public.task_work_sessions;
  end if;
end $$;
