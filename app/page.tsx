import { redirect } from "next/navigation";

export default function Home() {
  // #region agent log
  void fetch(
    "http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "15c600",
      },
      body: JSON.stringify({
        sessionId: "15c600",
        location: "app/page.tsx:Home",
        message: "server_redirect_login",
        data: { nonBlocking: true },
        timestamp: Date.now(),
        hypothesisId: "H6",
        runId: "post-fix-3",
      }),
    },
  ).catch(() => {});
  // #endregion
  redirect("/login");
}
