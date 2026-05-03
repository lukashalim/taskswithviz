import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskWorkSession } from "./types";

/** Sessions shorter than this are removed instead of saved as completed. */
export const WORK_SESSION_MIN_DURATION_SEC = 60;

export type EndWorkSessionResult =
  | { status: "ended"; session: TaskWorkSession }
  | { status: "discarded" };

export function isWorkSessionsTableUnavailableError(err: unknown): boolean {
  if (typeof err === "object" && err !== null) {
    const o = err as { code?: string; message?: string };
    if (o.code === "PGRST205") return true;
    if (
      typeof o.message === "string" &&
      (o.message.includes("task_work_sessions") ||
        o.message.includes("Could not find the table"))
    ) {
      return true;
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("PGRST205") ||
    msg.includes("task_work_sessions") ||
    msg.includes("Could not find the table")
  );
}

export async function fetchOpenWorkSessionForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<TaskWorkSession | null> {
  const { data, error } = await supabase
    .from("task_work_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as TaskWorkSession | null;
}

export async function fetchCompletedWorkSessionsForTask(
  supabase: SupabaseClient,
  taskId: string,
  limit = 25,
): Promise<TaskWorkSession[]> {
  const { data, error } = await supabase
    .from("task_work_sessions")
    .select("*")
    .eq("task_id", taskId)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as TaskWorkSession[];
}

/** UTC midnight 16 days ago — wide enough for a 14-day local chart plus timezone slack. */
export function focusSessionChartFetchSinceIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 16);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function countCompletedWorkSessionsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("task_work_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("ended_at", "is", null);

  if (error) throw error;
  return count ?? 0;
}

/** Completed sessions for the dashboard chart (durations + task filter). */
export interface CompletedSessionChartRow {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string;
}

export async function fetchCompletedSessionChartRowsSince(
  supabase: SupabaseClient,
  userId: string,
  sinceIso: string,
): Promise<CompletedSessionChartRow[]> {
  const { data, error } = await supabase
    .from("task_work_sessions")
    .select("id, task_id, started_at, ended_at")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .gte("ended_at", sinceIso)
    .order("ended_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CompletedSessionChartRow[];
}

function elapsedSecondsSince(startedAt: string): number {
  return Math.max(
    0,
    (Date.now() - new Date(startedAt).getTime()) / 1000,
  );
}

/** Ends or discards every in-progress session for the user (before starting a new one). */
export async function closeOpenWorkSessionsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { data: openRows, error: fetchError } = await supabase
    .from("task_work_sessions")
    .select("id, started_at")
    .eq("user_id", userId)
    .is("ended_at", null);

  if (fetchError) throw fetchError;

  for (const row of openRows ?? []) {
    if (elapsedSecondsSince(row.started_at) < WORK_SESSION_MIN_DURATION_SEC) {
      const { error } = await supabase
        .from("task_work_sessions")
        .delete()
        .eq("id", row.id)
        .eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("task_work_sessions")
        .update({ ended_at: now })
        .eq("id", row.id)
        .eq("user_id", userId);
      if (error) throw error;
    }
  }
}

export async function startWorkSession(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
): Promise<TaskWorkSession> {
  await closeOpenWorkSessionsForUser(supabase, userId);
  const { data, error } = await supabase
    .from("task_work_sessions")
    .insert({ task_id: taskId, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as TaskWorkSession;
}

export async function endWorkSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<EndWorkSessionResult> {
  const { data: row, error: fetchError } = await supabase
    .from("task_work_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .is("ended_at", null)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!row) {
    throw new Error("Session not found or already ended");
  }

  if (elapsedSecondsSince(row.started_at) < WORK_SESSION_MIN_DURATION_SEC) {
    const { error: delError } = await supabase
      .from("task_work_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (delError) throw delError;
    return { status: "discarded" };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("task_work_sessions")
    .update({ ended_at: now })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .is("ended_at", null)
    .select()
    .single();

  if (error) throw error;
  return { status: "ended", session: data as TaskWorkSession };
}
