"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { computeKpis } from "@/lib/tasks/derive";
import {
  deleteTask,
  insertTask,
  updateTask,
} from "@/lib/tasks/queries";
import type { Task, TaskStatus, TaskWorkSession } from "@/lib/tasks/types";
import {
  type CompletedSessionChartRow,
  endWorkSession,
  startWorkSession,
} from "@/lib/tasks/work-sessions";
import { DeleteConfirm } from "./delete-confirm";
import { FocusSessionsViz } from "./focus-sessions-viz";
import { KpiCards } from "./kpi-cards";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskList } from "./task-list";
import { WorkSessionBanner } from "./work-session-banner";

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const ad = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
    const bd = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
    return ad - bd;
  });
}

function applyRealtimeChange(
  tasks: Task[],
  payload: RealtimePostgresChangesPayload<Task>,
): Task[] {
  if (payload.eventType === "INSERT" && payload.new) {
    const row = payload.new as Task;
    if (tasks.some((t) => t.id === row.id)) return tasks;
    return sortTasks([...tasks, row]);
  }
  if (payload.eventType === "UPDATE" && payload.new) {
    const row = payload.new as Task;
    return sortTasks(tasks.map((t) => (t.id === row.id ? row : t)));
  }
  if (payload.eventType === "DELETE" && payload.old) {
    const id = (payload.old as { id: string }).id;
    return tasks.filter((t) => t.id !== id);
  }
  return tasks;
}

export function DashboardClient({
  initialTasks,
  userId,
  initialOpenSession,
  workSessionsEnabled,
  initialFocusSessionStats,
}: {
  initialTasks: Task[];
  userId: string;
  initialOpenSession: TaskWorkSession | null;
  workSessionsEnabled: boolean;
  initialFocusSessionStats: {
    totalCompleted: number;
    sessionsInWindow: CompletedSessionChartRow[];
  } | null;
}) {
  const [tasks, setTasks] = useState<Task[]>(() => sortTasks(initialTasks));
  const [now, setNow] = useState(() => new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openSession, setOpenSession] = useState<TaskWorkSession | null>(
    initialOpenSession,
  );
  const [tick, setTick] = useState(() => new Date());
  const [sessionStopping, setSessionStopping] = useState(false);
  const [focusTotalCompleted, setFocusTotalCompleted] = useState(
    () => initialFocusSessionStats?.totalCompleted ?? 0,
  );
  const [focusSessionsInWindow, setFocusSessionsInWindow] = useState<
    CompletedSessionChartRow[]
  >(() => [...(initialFocusSessionStats?.sessionsInWindow ?? [])]);

  const supabase = useMemo(() => createClient(), []);

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
    const channel = supabase
      .channel(`tasks-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setTasks((prev) =>
            applyRealtimeChange(
              prev,
              payload as RealtimePostgresChangesPayload<Task>,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  useEffect(() => {
    if (!workSessionsEnabled) return;

    const channel = supabase
      .channel(`work-sessions-${userId}`)
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
              const chartRow: CompletedSessionChartRow = {
                id: row.id,
                task_id: row.task_id,
                started_at: row.started_at,
                ended_at: row.ended_at,
              };
              setFocusSessionsInWindow((prev) => {
                if (prev.some((r) => r.id === chartRow.id)) return prev;
                setFocusTotalCompleted((c) => c + 1);
                return [...prev, chartRow];
              });
            }
            setOpenSession((prev) => {
              if (row.ended_at && prev?.id === row.id) {
                return null;
              }
              return prev;
            });
          }
          if (payload.eventType === "DELETE" && payload.old) {
            const id = (payload.old as { id: string }).id;
            setFocusSessionsInWindow((prev) => {
              const next = prev.filter((r) => r.id !== id);
              if (next.length < prev.length) {
                setFocusTotalCompleted((c) => Math.max(0, c - 1));
              }
              return next;
            });
            setOpenSession((prev) => (prev?.id === id ? null : prev));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, workSessionsEnabled]);

  const kpis = useMemo(() => computeKpis(tasks, now), [tasks, now]);

  const activeSessionTitle = useMemo(() => {
    if (!openSession) return "";
    return (
      tasks.find((t) => t.id === openSession.task_id)?.title ?? "Task"
    );
  }, [openSession, tasks]);

  const handleStartWorkSession = useCallback(
    async (task: Task) => {
      try {
        const row = await startWorkSession(supabase, userId, task.id);
        setOpenSession(row);
        toast.success("Focus session started");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not start session",
        );
      }
    },
    [supabase, userId],
  );

  const handleStopWorkSession = useCallback(async () => {
    if (!openSession) return;
    setSessionStopping(true);
    try {
      const result = await endWorkSession(supabase, openSession.id, userId);
      setOpenSession(null);
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
  }, [openSession, supabase, userId]);

  function openCreate() {
    setFormMode("create");
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setFormMode("edit");
    setEditingTask(task);
    setFormOpen(true);
  }

  async function handleFormSubmit(values: {
    title: string;
    description: string | null;
    due_date: string | null;
    status: TaskStatus;
    percent_done: number | null;
  }) {
    setFormLoading(true);
    try {
      if (formMode === "create") {
        await insertTask(supabase, userId, {
          title: values.title,
          description: values.description,
          due_date: values.due_date,
          status: values.status,
          percent_done: values.percent_done,
        });
        toast.success("Task created");
      } else if (editingTask) {
        await updateTask(supabase, editingTask.id, {
          title: values.title,
          description: values.description,
          due_date: values.due_date,
          status: values.status,
          percent_done: values.percent_done,
        });
        toast.success("Task updated");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteTask(supabase, deleteTarget.id);
      toast.success("Task deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track progress and due dates at a glance.
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="size-4" />
          Add task
        </Button>
      </div>

      {workSessionsEnabled && openSession ? (
        <WorkSessionBanner
          openSession={openSession}
          taskTitle={activeSessionTitle}
          tick={tick}
          onStop={handleStopWorkSession}
          stopping={sessionStopping}
        />
      ) : null}

      <KpiCards
        total={kpis.total}
        percentComplete={kpis.percentComplete}
        overdue={kpis.overdue}
      />

      {workSessionsEnabled && initialFocusSessionStats ? (
        <FocusSessionsViz
          totalCompleted={focusTotalCompleted}
          sessionsInWindow={focusSessionsInWindow}
          tasks={tasks.map((t) => ({ id: t.id, title: t.title }))}
        />
      ) : null}

      <TaskList
        tasks={tasks}
        reference={now}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        activeSessionTaskId={openSession?.task_id ?? null}
        onStartWorkSession={
          workSessionsEnabled ? handleStartWorkSession : undefined
        }
      />

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        task={editingTask}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />

      <DeleteConfirm
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete task?"
        description="This cannot be undone. The task will be removed from your list."
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
