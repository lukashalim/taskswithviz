import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const DASHBOARD_AUTH_TIMEOUT_MS = 8_000;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t0 = Date.now();
  const supabase = await createClient();

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("dashboard-auth-timeout")),
          DASHBOARD_AUTH_TIMEOUT_MS,
        ),
      ),
    ]);
    user = result.data.user;
  } catch {
    // Auth timed out or errored — treat as unauthenticated
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
      location: "app/dashboard/layout.tsx",
      message: "dashboard_layout_auth",
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="container flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Task Tracker
          </Link>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1">
        <div className="container max-w-6xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
