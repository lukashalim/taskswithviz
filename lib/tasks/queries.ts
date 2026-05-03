import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Task,
  TaskInsert,
  TaskPatch,
  TaskProgressUpdate,
} from "./types";

/** True when PostgREST reports `task_updates` is missing (migration not applied). */
export function isTaskUpdatesTableUnavailableError(err: unknown): boolean {
  if (typeof err === "object" && err !== null) {
    const o = err as { code?: string; message?: string };
    if (o.code === "PGRST205") return true;
    if (
      typeof o.message === "string" &&
      (o.message.includes("task_updates") ||
        o.message.includes("Could not find the table"))
    ) {
      return true;
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("PGRST205") ||
    msg.includes("task_updates") ||
    msg.includes("Could not find the table")
  );
}

export async function fetchTasksForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function insertTask(
  supabase: SupabaseClient,
  userId: string,
  input: TaskInsert,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.due_date ?? null,
      status: input.status ?? "not_started",
      percent_done: input.percent_done ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function fetchTaskByIdForUser(
  supabase: SupabaseClient,
  taskId: string,
  userId: string,
): Promise<Task | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as Task | null;
}

export async function fetchTaskProgressUpdates(
  supabase: SupabaseClient,
  taskId: string,
): Promise<TaskProgressUpdate[]> {
  const { data, error } = await supabase
    .from("task_updates")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TaskProgressUpdate[];
}

export async function insertTaskProgressUpdate(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  body: string,
): Promise<TaskProgressUpdate> {
  const { data, error } = await supabase
    .from("task_updates")
    .insert({
      task_id: taskId,
      user_id: userId,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as TaskProgressUpdate;
}

export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  patch: TaskPatch,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(
  supabase: SupabaseClient,
  taskId: string,
): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}
