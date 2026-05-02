import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const AUTH_MIDDLEWARE_TIMEOUT_MS = 10_000;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // #region agent log
    fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "15c600",
      },
      body: JSON.stringify({
        sessionId: "15c600",
        location: "lib/supabase/middleware.ts:updateSession",
        message: "missing_env_early_return",
        data: { hasUrl: !!url, hasKey: !!key },
        timestamp: Date.now(),
        hypothesisId: "H5",
        runId: "post-fix",
      }),
    }).catch(() => {});
    // #endregion
    return supabaseResponse;
  }

  // Skip network auth check when there are no session cookies — avoids a
  // ~1-2 s Supabase round-trip on every unauthenticated request.
  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  if (!hasSessionCookie) {
    // #region agent log
    fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "15c600",
      },
      body: JSON.stringify({
        sessionId: "15c600",
        location: "lib/supabase/middleware.ts:updateSession",
        message: "no_session_cookie_skip",
        data: { pathname: request.nextUrl.pathname },
        timestamp: Date.now(),
        hypothesisId: "H2",
        runId: "post-fix",
      }),
    }).catch(() => {});
    // #endregion
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[],
        headersToApply: Record<string, string>,
      ) {
        // #region agent log
        fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "15c600",
          },
          body: JSON.stringify({
            sessionId: "15c600",
            location: "lib/supabase/middleware.ts:setAll",
            message: "setAll_invoked",
            data: {
              cookieCount: cookiesToSet.length,
              headerKeys: Object.keys(headersToApply),
            },
            timestamp: Date.now(),
            hypothesisId: "H4",
            runId: "pre-fix",
          }),
        }).catch(() => {});
        // #endregion
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headersToApply).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const tAuth = Date.now();
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("supabase-auth-middleware-timeout")),
          AUTH_MIDDLEWARE_TIMEOUT_MS,
        ),
      ),
    ]);
    // #region agent log
    fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "15c600",
      },
      body: JSON.stringify({
        sessionId: "15c600",
        location: "lib/supabase/middleware.ts:updateSession",
        message: "getUser_race_ok",
        data: { ms: Date.now() - tAuth },
        timestamp: Date.now(),
        hypothesisId: "H1",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
  } catch (e) {
    // #region agent log
    fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "15c600",
      },
      body: JSON.stringify({
        sessionId: "15c600",
        location: "lib/supabase/middleware.ts:updateSession",
        message: "getUser_race_catch",
        data: {
          ms: Date.now() - tAuth,
          err:
            e instanceof Error ? e.message : typeof e === "string" ? e : "unknown",
        },
        timestamp: Date.now(),
        hypothesisId: "H1",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    // Supabase unreachable or slow — still return a response so the app loads
    // (e.g. embedded browser, offline, or blocked egress).
  }

  return supabaseResponse;
}
