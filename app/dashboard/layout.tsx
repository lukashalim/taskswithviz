import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeaderInspiration } from "@/components/dashboard/dashboard-header-inspiration";
import { Button } from "@/components/ui/button";
import { getRandomTaskInspiration } from "@/lib/task-inspiration";
import { createClient } from "@/lib/supabase/server";

const DASHBOARD_AUTH_TIMEOUT_MS = 8_000;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  if (!user) {
    redirect("/login");
  }

  const inspiration = getRandomTaskInspiration();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="container flex min-h-14 max-w-6xl items-center gap-2 px-4 py-2 sm:gap-4 sm:py-0">
          <Link
            href="/dashboard"
            className="shrink-0 text-sm font-semibold tracking-tight text-foreground"
          >
            Task Tracker
          </Link>
          <DashboardHeaderInspiration inspiration={inspiration} />
          <form action="/auth/signout" method="post" className="shrink-0">
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
