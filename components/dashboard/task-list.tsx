"use client";

import {
  groupTasksByVisualStatus,
  VISUAL_STATUS_ORDER,
} from "@/lib/tasks/derive";
import type { Task, VisualStatus } from "@/lib/tasks/types";
import { TaskCard } from "./task-card";

const SECTION_TITLES: Record<VisualStatus, string> = {
  overdue: "Overdue",
  in_progress: "In progress",
  not_started: "Not started",
  complete: "Complete",
};

interface TaskListProps {
  tasks: Task[];
  reference: Date;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskList({
  tasks,
  reference,
  onEdit,
  onDelete,
}: TaskListProps) {
  const grouped = groupTasksByVisualStatus(tasks, reference);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-12 text-center">
        <p className="font-medium text-foreground">No tasks yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first task to see it here. Status updates appear
          instantly.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {VISUAL_STATUS_ORDER.map((key) => {
        const sectionTasks = grouped.get(key) ?? [];
        if (sectionTasks.length === 0) return null;
        return (
          <section key={key} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold tracking-tight">
                {SECTION_TITLES[key]}
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {sectionTasks.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sectionTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  reference={reference}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
