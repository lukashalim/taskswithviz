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
  created_at: string;
  updated_at: string;
}

export interface TaskInsert {
  title: string;
  description?: string | null;
  due_date?: string | null;
  status?: TaskStatus;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  status?: TaskStatus;
}
