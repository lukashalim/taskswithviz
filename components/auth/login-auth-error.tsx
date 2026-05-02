"use client";

import { useEffect, useState } from "react";

/** Reads ?error=auth without useSearchParams (avoids RSC/Suspense edge cases). */
export function LoginAuthError() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const err = q.get("error") === "auth";
    setShow(err);
    // #region agent log
    fetch("http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "15c600",
      },
      body: JSON.stringify({
        sessionId: "15c600",
        location: "components/auth/login-auth-error.tsx",
        message: "login_error_query_check",
        data: { showAuthError: err },
        timestamp: Date.now(),
        hypothesisId: "H6",
        runId: "post-fix-2",
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  if (!show) return null;

  return (
    <p className="text-sm text-destructive">
      Authentication failed. Try again or request a new link.
    </p>
  );
}
