import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TaskDetailClient } from "@/components/dashboard/task-detail-client";
import { createClient } from "@/lib/supabase/server";
import {
  fetchTaskByIdForUser,
  fetchTaskProgressUpdates,
  isTaskUpdatesTableUnavailableError,
} from "@/lib/tasks/queries";
import {
  fetchCompletedWorkSessionsForTask,
  fetchOpenWorkSessionForUser,
  isWorkSessionsTableUnavailableError,
} from "@/lib/tasks/work-sessions";
const AUTH_TIMEOUT_MS = 8_000;

async function getSessionUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("auth-timeout")), AUTH_TIMEOUT_MS),
      ),
    ]);
    return result.data.user;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return { title: "Task | Task Tracker" };
  }
  const task = await fetchTaskByIdForUser(supabase, id, user.id);
  if (!task) {
    return { title: "Task | Task Tracker" };
  }
  return {
    title: `${task.title} | Task Tracker`,
    description: task.description ?? undefined,
  };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    redirect("/login");
  }

  const task = await fetchTaskByIdForUser(supabase, id, user.id);
  if (!task) {
    notFound();
  }

  let initialUpdates: Awaited<
    ReturnType<typeof fetchTaskProgressUpdates>
  > = [];
  let progressLogEnabled = true;
  try {
    initialUpdates = await fetchTaskProgressUpdates(supabase, id);
  } catch (e) {
    if (isTaskUpdatesTableUnavailableError(e)) {
      progressLogEnabled = false;
    } else {
      throw e;
    }
  }

  let initialOpenSession: Awaited<
    ReturnType<typeof fetchOpenWorkSessionForUser>
  > = null;
  let initialCompletedSessions: Awaited<
    ReturnType<typeof fetchCompletedWorkSessionsForTask>
  > = [];
  let workSessionsEnabled = true;
  try {
    initialOpenSession = await fetchOpenWorkSessionForUser(supabase, user.id);
    initialCompletedSessions = await fetchCompletedWorkSessionsForTask(
      supabase,
      id,
    );
  } catch (e) {
    if (isWorkSessionsTableUnavailableError(e)) {
      workSessionsEnabled = false;
    } else {
      throw e;
    }
  }

  return (
    <TaskDetailClient
      initialTask={task}
      userId={user.id}
      initialUpdates={initialUpdates}
      progressLogEnabled={progressLogEnabled}
      initialOpenSession={initialOpenSession}
      initialCompletedSessions={initialCompletedSessions}
      workSessionsEnabled={workSessionsEnabled}
    />
  );
}
