import Link from "next/link";
import { LoginAuthError } from "@/components/auth/login-auth-error";
import { LoginAuthRedirect } from "@/components/auth/login-auth-redirect";
import { LoginTabs } from "@/components/auth/login-tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  // #region agent log
  fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "15c600",
    },
    body: JSON.stringify({
      sessionId: "15c600",
      location: "app/login/page.tsx",
      message: "login_page_render_start",
      data: {},
      timestamp: Date.now(),
      hypothesisId: "H1",
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f4f5",
        color: "#171717",
      }}
    >
      <LoginAuthRedirect />
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          Task Tracker
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize work with clarity
        </p>
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Sign in with a password or use a magic link.
          </CardDescription>
          <LoginAuthError />
        </CardHeader>
        <CardContent>
          <LoginTabs />
        </CardContent>
      </Card>
    </div>
  );
}
