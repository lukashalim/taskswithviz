import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task, TaskInsert, TaskUpdate } from "./types";

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
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(
  supabase: SupabaseClient,
  taskId: string,
  patch: TaskUpdate,
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
