export type TaskStatus = "not_started" | "in_progress" | "complete";

export type VisualStatus =
  | "complete"
  | "overdue"
  | "in_progress"
  | "not_started";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  /** 0–100 user estimate; null = not set */
  percent_done: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInsert {
  title: string;
  description?: string | null;
  due_date?: string | null;
  status?: TaskStatus;
  percent_done?: number | null;
}

export interface TaskPatch {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  status?: TaskStatus;
  percent_done?: number | null;
}

/** Append-only progress note on a task */
export interface TaskProgressUpdate {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

/** Focus / work session on a task (ended_at null = in progress) */
export interface TaskWorkSession {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
}
