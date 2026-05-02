"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Sends logged-in users from /login to /dashboard (no server cookies() on /). */
export function LoginAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
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
        location: "components/auth/login-auth-redirect.tsx",
        message: "login_gate_effect_start",
        data: {},
        timestamp: Date.now(),
        hypothesisId: "H6",
        runId: "post-fix-2",
      }),
    }).catch(() => {});
    // #endregion

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      // #region agent log
      fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "15c600",
        },
        body: JSON.stringify({
          sessionId: "15c600",
          location: "components/auth/login-auth-redirect.tsx",
          message: "login_gate_after_getUser",
          data: { hasUser: !!user, ms: Date.now() - t0 },
          timestamp: Date.now(),
          hypothesisId: "H6",
          runId: "post-fix-2",
        }),
      }).catch(() => {});
      // #endregion
      if (user) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  return null;
}
