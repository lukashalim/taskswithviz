import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { createClient } from "@/lib/supabase/server";
import { fetchTasksForUser } from "@/lib/tasks/queries";

export const metadata: Metadata = {
  title: "Dashboard | Task Tracker",
  description: "Your tasks and progress",
};

export default async function DashboardPage() {
  const t0 = Date.now();
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
  // #region agent log
  fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "15c600",
    },
    body: JSON.stringify({
      sessionId: "15c600",
      location: "app/dashboard/page.tsx",
      message: "dashboard_page_auth",
      data: { ms: Date.now() - t0, hasUser: !!user },
      timestamp: Date.now(),
      hypothesisId: "H3",
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion
  if (!user) {
    redirect("/login");
  }

  const tasks = await fetchTasksForUser(supabase, user.id);

  return <DashboardClient initialTasks={tasks} userId={user.id} />;
}
