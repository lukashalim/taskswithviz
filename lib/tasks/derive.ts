import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { Task, TaskStatus, VisualStatus } from "./types";

export type DaysRemainingTone = "success" | "warning" | "danger" | "muted";

export interface DaysRemaining {
  /** e.g. "3d left" | "Today" | "2d over" | "Done" | "-" */
  label: string;
  /** Signed calendar days until due; null when no due date */
  days: number | null;
  /** 0..1, fraction of created->due elapsed (capped at 1 when overdue or complete) */
  progress: number;
  tone: DaysRemainingTone;
}

/**
 * Calendar-day countdown to due date + progress along created→due for ring UI.
 */
export function computeDaysRemaining(
  task: Task,
  reference: Date = new Date(),
): DaysRemaining {
  if (task.status === "complete") {
    return {
      label: "Done",
      days: null,
      progress: 1,
      tone: "success",
    };
  }

  if (!task.due_date) {
    return {
      label: "-",
      days: null,
      progress: 0,
      tone: "muted",
    };
  }

  const ref = startOfDay(reference);
  const due = startOfDay(new Date(task.due_date));
  const created = startOfDay(new Date(task.created_at));

  const daysLeft = differenceInCalendarDays(due, ref);

  const c = created.getTime();
  const d = due.getTime();
  const r = ref.getTime();
  const total = d - c;

  let progress: number;
  if (total <= 0) {
    progress = r >= d ? 1 : 0;
  } else {
    progress = Math.min(1, Math.max(0, (r - c) / total));
  }

  if (daysLeft < 0) {
    const over = Math.abs(daysLeft);
    return {
      label: `${over}d over`,
      days: daysLeft,
      progress: 1,
      tone: "danger",
    };
  }

  if (daysLeft === 0) {
    return {
      label: "Today",
      days: 0,
      progress,
      tone: "warning",
    };
  }

  let remainingFraction = 1 - progress;
  if (total > 0 && r <= d) {
    remainingFraction = Math.min(1, Math.max(0, (d - r) / total));
  }

  const tone: DaysRemainingTone =
    remainingFraction > 0.5 ? "success" : "warning";

  return {
    label: `${daysLeft}d left`,
    days: daysLeft,
    progress,
    tone,
  };
}

export function deriveVisualStatus(
  task: {
    status: TaskStatus;
    due_date: string | null;
  },
  reference: Date = new Date(),
): VisualStatus {
  if (task.status === "complete") return "complete";
  if (task.due_date && new Date(task.due_date) < reference) return "overdue";
  return task.status;
}

export function computeKpis(tasks: Task[], reference: Date = new Date()) {
  const total = tasks.length;
  const complete = tasks.filter((t) => t.status === "complete").length;
  const overdue = tasks.filter(
    (t) => deriveVisualStatus(t, reference) === "overdue",
  ).length;
  const percentComplete =
    total === 0 ? 0 : Math.round((complete / total) * 1000) / 10;
  return { total, complete, overdue, percentComplete };
}

export const VISUAL_STATUS_ORDER: VisualStatus[] = [
  "overdue",
  "in_progress",
  "not_started",
  "complete",
];

export function groupTasksByVisualStatus(
  tasks: Task[],
  reference: Date = new Date(),
): Map<VisualStatus, Task[]> {
  const map = new Map<VisualStatus, Task[]>();
  for (const vs of VISUAL_STATUS_ORDER) {
    map.set(vs, []);
  }
  for (const t of tasks) {
    const vs = deriveVisualStatus(t, reference);
    map.get(vs)?.push(t);
  }
  return map;
}
