import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const t0 = Date.now();
  // #region agent log
  fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "15c600",
    },
    body: JSON.stringify({
      sessionId: "15c600",
      location: "proxy.ts:proxy",
      message: "proxy_start",
      data: { pathname: request.nextUrl.pathname },
      timestamp: Date.now(),
      hypothesisId: "H1",
      runId: "pre-fix",
    }),
  }).catch(() => {});
  // #endregion
  const res = await updateSession(request);
  // #region agent log
  fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "15c600",
    },
    body: JSON.stringify({
      sessionId: "15c600",
      location: "proxy.ts:proxy",
      message: "proxy_end",
      data: { ms: Date.now() - t0, status: res.status },
      timestamp: Date.now(),
      hypothesisId: "H1",
      runId: "pre-fix",
    }),
  }).catch(() => {});
  // #endregion
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
