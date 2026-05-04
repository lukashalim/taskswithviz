-- Progress / status updates for tasks (append-only log).
-- Run in Supabase SQL Editor or via CLI migrate.

create table if not exists public.task_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists task_updates_task_id_created_at_idx
  on public.task_updates (task_id, created_at desc);

alter table public.task_updates enable row level security;

drop policy if exists "task_updates_select" on public.task_updates;
create policy "task_updates_select"
  on public.task_updates for select
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_updates.task_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "task_updates_insert" on public.task_updates;
create policy "task_updates_insert"
  on public.task_updates for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id and t.user_id = auth.uid()
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'task_updates'
  ) then
    alter publication supabase_realtime add table public.task_updates;
  end if;
end $$;
