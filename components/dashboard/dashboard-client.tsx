"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { computeKpis } from "@/lib/tasks/derive";
import {
  deleteTask,
  insertTask,
  updateTask,
} from "@/lib/tasks/queries";
import type { Task, TaskStatus } from "@/lib/tasks/types";
import { DeleteConfirm } from "./delete-confirm";
import { KpiCards } from "./kpi-cards";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskList } from "./task-list";

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
}: {
  initialTasks: Task[];
  userId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(() => sortTasks(initialTasks));
  const [now, setNow] = useState(() => new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

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

  const kpis = useMemo(() => computeKpis(tasks, now), [tasks, now]);

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
  }) {
    setFormLoading(true);
    try {
      if (formMode === "create") {
        await insertTask(supabase, userId, {
          title: values.title,
          description: values.description,
          due_date: values.due_date,
          status: values.status,
        });
        toast.success("Task created");
      } else if (editingTask) {
        await updateTask(supabase, editingTask.id, {
          title: values.title,
          description: values.description,
          due_date: values.due_date,
          status: values.status,
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

      <KpiCards
        total={kpis.total}
        percentComplete={kpis.percentComplete}
        overdue={kpis.overdue}
      />

      <TaskList
        tasks={tasks}
        reference={now}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
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
