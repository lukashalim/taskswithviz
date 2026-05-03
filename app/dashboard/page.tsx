import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { createClient } from "@/lib/supabase/server";
import { fetchTasksForUser } from "@/lib/tasks/queries";
import {
  type CompletedSessionChartRow,
  countCompletedWorkSessionsForUser,
  fetchCompletedSessionChartRowsSince,
  fetchOpenWorkSessionForUser,
  focusSessionChartFetchSinceIso,
  isWorkSessionsTableUnavailableError,
} from "@/lib/tasks/work-sessions";

export const metadata: Metadata = {
  title: "Dashboard | Task Tracker",
  description: "Your tasks and progress",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("dashboard-page-auth-timeout")),
          8_000,
        ),
      ),
    ]);
    user = result.data.user;
  } catch {
    // timeout — treat as unauthenticated
  }
  if (!user) {
    redirect("/login");
  }

  const tasks = await fetchTasksForUser(supabase, user.id);

  let initialOpenSession: Awaited<
    ReturnType<typeof fetchOpenWorkSessionForUser>
  > = null;
  let initialFocusSessionStats: {
    totalCompleted: number;
    sessionsInWindow: CompletedSessionChartRow[];
  } | null = null;
  let workSessionsEnabled = true;
  try {
    initialOpenSession = await fetchOpenWorkSessionForUser(supabase, user.id);
    const sinceIso = focusSessionChartFetchSinceIso();
    const [totalCompleted, sessionsInWindow] = await Promise.all([
      countCompletedWorkSessionsForUser(supabase, user.id),
      fetchCompletedSessionChartRowsSince(supabase, user.id, sinceIso),
    ]);
    initialFocusSessionStats = {
      totalCompleted,
      sessionsInWindow,
    };
  } catch (e) {
    if (isWorkSessionsTableUnavailableError(e)) {
      workSessionsEnabled = false;
    } else {
      throw e;
    }
  }

  return (
    <DashboardClient
      initialTasks={tasks}
      userId={user.id}
      initialOpenSession={initialOpenSession}
      workSessionsEnabled={workSessionsEnabled}
      initialFocusSessionStats={initialFocusSessionStats}
    />
  );
}
