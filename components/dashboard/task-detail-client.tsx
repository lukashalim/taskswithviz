"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeft, BookOpen, Pencil, Square, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { deriveVisualStatus } from "@/lib/tasks/derive";
import {
  insertTaskProgressUpdate,
  updateTask,
} from "@/lib/tasks/queries";
import {
  formatElapsedFromSeconds,
  elapsedSeconds,
} from "@/lib/tasks/format-elapsed";
import type {
  Task,
  TaskProgressUpdate,
  TaskStatus,
  TaskWorkSession,
} from "@/lib/tasks/types";
import {
  endWorkSession,
  startWorkSession,
} from "@/lib/tasks/work-sessions";
import type { TaskInspiration } from "@/lib/task-inspiration";
import { cn } from "@/lib/utils";
import {
  taskProgressUpdateBodySchema,
  type TaskProgressUpdateFormValues,
} from "@/lib/validators";
import { DaysRing } from "./days-ring";
import { StatusBadge } from "./status-badge";
import { TaskFormDialog } from "./task-form-dialog";

function mergeUpdate(
  prev: TaskProgressUpdate[],
  row: TaskProgressUpdate,
): TaskProgressUpdate[] {
  if (prev.some((u) => u.id === row.id)) return prev;
  return [...prev, row].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

interface TaskDetailClientProps {
  initialTask: Task;
  userId: string;
  initialUpdates: TaskProgressUpdate[];
  /** False when `public.task_updates` has not been created yet (migration). */
  progressLogEnabled?: boolean;
  initialOpenSession: TaskWorkSession | null;
  initialCompletedSessions: TaskWorkSession[];
  /** False when `public.task_work_sessions` is missing (migration). */
  workSessionsEnabled?: boolean;
  inspiration: TaskInspiration;
}

function mergeCompletedSession(
  prev: TaskWorkSession[],
  row: TaskWorkSession,
): TaskWorkSession[] {
  const next = prev.some((s) => s.id === row.id)
    ? prev.map((s) => (s.id === row.id ? row : s))
    : [row, ...prev];
  return next.sort(
    (a, b) =>
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );
}

export function TaskDetailClient({
  initialTask,
  userId,
  initialUpdates,
  progressLogEnabled = true,
  initialOpenSession,
  initialCompletedSessions,
  workSessionsEnabled = true,
  inspiration,
}: TaskDetailClientProps) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [updates, setUpdates] = useState(initialUpdates);
  const [now, setNow] = useState(() => new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [openSession, setOpenSession] = useState<TaskWorkSession | null>(
    initialOpenSession,
  );
  const [completedSessions, setCompletedSessions] = useState<
    TaskWorkSession[]
  >(initialCompletedSessions);
  const [tick, setTick] = useState(() => new Date());
  const [sessionStopping, setSessionStopping] = useState(false);
  const [sessionStarting, setSessionStarting] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const visual = deriveVisualStatus(task, now);

  const progressForm = useForm<TaskProgressUpdateFormValues>({
    resolver: zodResolver(taskProgressUpdateBodySchema),
    defaultValues: { body: "" },
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!openSession || !workSessionsEnabled) return;
    const id = window.setInterval(() => setTick(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [openSession, workSessionsEnabled]);

  useEffect(() => {
    if (!workSessionsEnabled) return;

    const channel = supabase
      .channel(`task-detail-work-sessions-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_work_sessions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new) {
            const row = payload.new as TaskWorkSession;
            if (row.ended_at == null) {
              setOpenSession(row);
            }
          }
          if (payload.eventType === "UPDATE" && payload.new) {
            const row = payload.new as TaskWorkSession;
            if (row.ended_at) {
              setOpenSession((prev) =>
                prev?.id === row.id ? null : prev,
              );
              if (row.task_id === task.id) {
                setCompletedSessions((prev) =>
                  mergeCompletedSession(prev, row),
                );
              }
            }
          }
          if (payload.eventType === "DELETE" && payload.old) {
            const id = (payload.old as { id: string }).id;
            setOpenSession((prev) => (prev?.id === id ? null : prev));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, workSessionsEnabled, task.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`task-detail-${task.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `id=eq.${task.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            setTask(payload.new as Task);
          }
          if (payload.eventType === "DELETE") {
            toast.message("This task was removed");
            router.push("/dashboard");
          }
        },
      );

    if (progressLogEnabled) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_updates",
          filter: `task_id=eq.${task.id}`,
        },
        (payload) => {
          if (payload.new) {
            const row = payload.new as TaskProgressUpdate;
            setUpdates((prev) => mergeUpdate(prev, row));
          }
        },
      );
    }

    void channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, task.id, router, progressLogEnabled]);

  async function onProgressSubmit(values: TaskProgressUpdateFormValues) {
    try {
      const row = await insertTaskProgressUpdate(
        supabase,
        userId,
        task.id,
        values.body,
      );
      setUpdates((prev) => mergeUpdate(prev, row));
      progressForm.reset({ body: "" });
      toast.success("Update added");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save update",
      );
    }
  }

  const sessionOnThisTask =
    openSession != null && openSession.task_id === task.id;
  const sessionElsewhere =
    openSession != null && openSession.task_id !== task.id;

  const handleStartWorkSession = useCallback(async () => {
    setSessionStarting(true);
    try {
      const row = await startWorkSession(supabase, userId, task.id);
      setOpenSession(row);
      toast.success("Focus session started");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start session",
      );
    } finally {
      setSessionStarting(false);
    }
  }, [supabase, userId, task.id]);

  const handleStopWorkSession = useCallback(async () => {
    if (!openSession) return;
    setSessionStopping(true);
    try {
      const result = await endWorkSession(supabase, openSession.id, userId);
      setOpenSession(null);
      if (result.status === "ended" && result.session.task_id === task.id) {
        setCompletedSessions((prev) =>
          mergeCompletedSession(prev, result.session),
        );
      }
      if (result.status === "discarded") {
        toast.message("Under 1 minute — session not saved");
      } else {
        toast.success("Session stopped");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not stop session",
      );
    } finally {
      setSessionStopping(false);
    }
  }, [openSession, supabase, userId, task.id]);

  async function handleEditSubmit(values: {
    title: string;
    description: string | null;
    due_date: string | null;
    status: TaskStatus;
    percent_done: number | null;
  }) {
    setEditLoading(true);
    try {
      await updateTask(supabase, task.id, {
        title: values.title,
        description: values.description,
        due_date: values.due_date,
        status: values.status,
        percent_done: values.percent_done,
      });
      toast.success("Task updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-4 inline-flex gap-1 px-0",
          )}
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {task.title}
              </h1>
              <StatusBadge status={visual} />
            </div>
            {task.due_date ? (
              <p className="text-sm text-muted-foreground">
                Due {format(new Date(task.due_date), "PPP")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No due date</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <DaysRing task={task} reference={now} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
              Edit task
            </Button>
          </div>
        </div>

        {task.description ? (
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            {task.description}
          </p>
        ) : (
          <p className="mt-4 text-sm italic text-muted-foreground">
            No description
          </p>
        )}

        <aside
          className="mt-6 rounded-xl border border-border/80 bg-muted/20 px-4 py-4 sm:px-5"
          aria-label="Reflection for this visit"
        >
          <div className="flex gap-3">
            <BookOpen
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0 space-y-2">
              {inspiration.context ? (
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {inspiration.context}
                </p>
              ) : null}
              <blockquote className="text-sm leading-relaxed text-foreground">
                {inspiration.body}
              </blockquote>
              <p className="text-xs text-muted-foreground">— {inspiration.author}</p>
            </div>
          </div>
        </aside>
      </div>

      {workSessionsEnabled && sessionElsewhere && openSession ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Focus session on another task ·{" "}
              <span className="tabular-nums text-amber-800 dark:text-amber-200">
                {formatElapsedFromSeconds(
                  elapsedSeconds(
                    new Date(openSession.started_at),
                    tick,
                  ),
                )}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Stop here or open that task to continue.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/dashboard/tasks/${openSession.task_id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Open task
            </Link>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5"
              disabled={sessionStopping}
              onClick={handleStopWorkSession}
            >
              <Square className="size-3.5 fill-current" />
              {sessionStopping ? "Stopping…" : "Stop"}
            </Button>
          </div>
        </div>
      ) : null}

      {workSessionsEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Focus sessions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track dedicated work time on this task. Only one open session at
              a time across all tasks. Sessions under one minute are not saved
              when you stop or start a session on another task.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {sessionOnThisTask && openSession ? (
              <div className="flex flex-col gap-4 rounded-lg border border-violet-500/35 bg-violet-500/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Session running ·{" "}
                    <span className="tabular-nums text-violet-700 dark:text-violet-300">
                      {formatElapsedFromSeconds(
                        elapsedSeconds(
                          new Date(openSession.started_at),
                          tick,
                        ),
                      )}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Started{" "}
                    {format(new Date(openSession.started_at), "PPp")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 gap-1.5"
                  disabled={sessionStopping}
                  onClick={handleStopWorkSession}
                >
                  <Square className="size-3.5 fill-current" />
                  {sessionStopping ? "Stopping…" : "Stop session"}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                className="gap-2"
                disabled={sessionStarting || sessionOnThisTask}
                onClick={handleStartWorkSession}
              >
                <Timer className="size-4" />
                {sessionStarting ? "Starting…" : "Start focus session"}
              </Button>
            )}

            {completedSessions.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No completed sessions yet. Start a session above; when you
                stop, it appears here.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Recent sessions
                </p>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {completedSessions.map((s) => {
                    const dur =
                      s.ended_at != null
                        ? elapsedSeconds(
                            new Date(s.started_at),
                            new Date(s.ended_at),
                          )
                        : 0;
                    return (
                      <li
                        key={s.id}
                        className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-muted-foreground">
                          {format(new Date(s.started_at), "PPp")} →{" "}
                          {s.ended_at
                            ? format(new Date(s.ended_at), "PPp")
                            : "—"}
                        </span>
                        <span className="tabular-nums font-medium text-foreground">
                          {formatElapsedFromSeconds(dur)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <p className="font-medium text-amber-950 dark:text-amber-100">
            Focus sessions are not set up yet
          </p>
          <p className="mt-2 text-amber-900/90 dark:text-amber-50/90">
            Run{" "}
            <code className="rounded bg-amber-500/20 px-1 py-0.5 text-xs">
              supabase/migrations/20260202160000_task_work_sessions.sql
            </code>{" "}
            in the Supabase SQL Editor and add{" "}
            <code className="rounded bg-amber-500/20 px-1 py-0.5 text-xs">
              task_work_sessions
            </code>{" "}
            to the{" "}
            <code className="rounded bg-amber-500/20 px-1 py-0.5 text-xs">
              supabase_realtime
            </code>{" "}
            publication, then reload.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress updates</CardTitle>
          <p className="text-sm text-muted-foreground">
            {progressLogEnabled
              ? "Add notes as you work. Newest entries appear at the bottom."
              : "Enable the database table below to use the progress log."}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!progressLogEnabled ? (
            <div
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
              role="status"
            >
              <p className="font-medium text-amber-950 dark:text-amber-100">
                Progress log is not set up yet
              </p>
              <p className="mt-2 text-amber-900/90 dark:text-amber-50/90">
                Supabase returned{" "}
                <code className="rounded bg-amber-500/20 px-1 py-0.5 text-xs">
                  PGRST205
                </code>{" "}
                — the{" "}
                <code className="rounded bg-amber-500/20 px-1 py-0.5 text-xs">
                  task_updates
                </code>{" "}
                table is missing. Run the SQL in{" "}
                <code className="rounded bg-amber-500/20 px-1 py-0.5 text-xs">
                  supabase/migrations/20260202120000_task_updates.sql
                </code>{" "}
                in the Supabase SQL Editor, then add{" "}
                <code className="rounded bg-amber-500/20 px-1 py-0.5 text-xs">
                  task_updates
                </code>{" "}
                to the{" "}
                <code className="rounded bg-amber-500/20 px-1 py-0.5 text-xs">
                  supabase_realtime
                </code>{" "}
                publication. Reload this page when done.
              </p>
            </div>
          ) : null}

          <form
            className="space-y-3"
            onSubmit={progressForm.handleSubmit(onProgressSubmit)}
          >
            <div className="space-y-2">
              <Label htmlFor="progress-body">What changed?</Label>
              <Textarea
                id="progress-body"
                placeholder="e.g. Finished research, blocked on review…"
                rows={4}
                className="resize-y min-h-[100px]"
                disabled={!progressLogEnabled}
                {...progressForm.register("body")}
              />
              {progressForm.formState.errors.body ? (
                <p className="text-sm text-destructive">
                  {progressForm.formState.errors.body.message}
                </p>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={
                !progressLogEnabled || progressForm.formState.isSubmitting
              }
            >
              {progressForm.formState.isSubmitting
                ? "Saving…"
                : "Add update"}
            </Button>
          </form>

          {!progressLogEnabled ? null : updates.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              No updates yet. Log progress above to build a history for this
              task.
            </p>
          ) : (
            <ul className="space-y-4 border-t border-border pt-6">
              {updates.map((u) => (
                <li
                  key={u.id}
                  className="rounded-lg border border-border/80 bg-card/50 px-4 py-3"
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {u.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                    {format(new Date(u.created_at), "PPp")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <TaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        task={task}
        onSubmit={handleEditSubmit}
        loading={editLoading}
      />
    </div>
  );
}
