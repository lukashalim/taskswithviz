-- Allow users to delete their own work sessions (e.g. discard sessions under 1 min in app).

drop policy if exists "task_work_sessions_delete" on public.task_work_sessions;
create policy "task_work_sessions_delete"
  on public.task_work_sessions for delete
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_work_sessions.task_id and t.user_id = auth.uid()
    )
  );
