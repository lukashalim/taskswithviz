-- Optional 0–100 work-done % for comparing to schedule (created_at → due_date).

alter table public.tasks
  add column if not exists percent_done smallint null
  constraint tasks_percent_done_range check (
    percent_done is null
    or (percent_done >= 0 and percent_done <= 100)
  );

comment on column public.tasks.percent_done is
  'User-estimated work completion 0–100; null means not set.';
