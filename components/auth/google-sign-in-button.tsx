"use client";

import { useEffect, useState } from "react";
import { getAuthSiteOrigin } from "@/lib/auth/site-origin";
import { authErrorMessage } from "@/lib/auth/user-facing-error";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const siteOrigin = getAuthSiteOrigin();
    // #region agent log
    fetch(
      "http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "d286e2",
        },
        body: JSON.stringify({
          sessionId: "d286e2",
          location: "google-sign-in-button.tsx:mount",
          message: "login_google_button_mounted",
          data: {
            hostname: window.location.hostname,
            windowOrigin: window.location.origin,
            siteOrigin,
            envSiteUrlLen: (process.env.NEXT_PUBLIC_SITE_URL ?? "").length,
          },
          timestamp: Date.now(),
          hypothesisId: "H4",
          runId: "pre-fix",
        }),
      },
    ).catch(() => {});
    // #endregion
  }, []);

  async function onClick() {
    setLoading(true);
    try {
      const siteOrigin = getAuthSiteOrigin();
      const redirectTo = `${siteOrigin}/auth/callback`;
      // #region agent log
      fetch(
        "http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "d286e2",
          },
          body: JSON.stringify({
            sessionId: "d286e2",
            location: "google-sign-in-button.tsx:onClick",
            message: "oauth_before_signInWithOAuth",
            data: {
              hostname: window.location.hostname,
              windowOrigin: window.location.origin,
              siteOrigin,
              redirectTo,
              envSiteUrlLen: (process.env.NEXT_PUBLIC_SITE_URL ?? "").length,
              envSiteUrlIsLocalhost: (
                process.env.NEXT_PUBLIC_SITE_URL ?? ""
              ).includes("localhost"),
            },
            timestamp: Date.now(),
            hypothesisId: "H1-H2-H4",
            runId: "pre-fix",
          }),
        },
      ).catch(() => {});
      // #endregion

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) throw error;

      // #region agent log
      let redirectToInAuthUrl: string | null = null;
      let authUrlHost = "";
      try {
        if (data.url) {
          const u = new URL(data.url);
          authUrlHost = u.host;
          redirectToInAuthUrl = u.searchParams.get("redirect_to");
        }
      } catch {
        redirectToInAuthUrl = "parse_error";
      }
      fetch(
        "http://127.0.0.1:7476/ingest/988fe597-edd2-4036-9c3f-9f7d76d5ff11",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "d286e2",
          },
          body: JSON.stringify({
            sessionId: "d286e2",
            location: "google-sign-in-button.tsx:afterOAuthUrl",
            message: "oauth_supabase_authorize_url_parsed",
            data: {
              authUrlHost,
              redirectToInAuthUrl,
              redirectToInAuthUrlHasLocalhost:
                (redirectToInAuthUrl ?? "").includes("localhost"),
            },
            timestamp: Date.now(),
            hypothesisId: "H3-H5",
            runId: "pre-fix",
          }),
        },
      ).catch(() => {});
      // #endregion

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(authErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      disabled={loading}
      onClick={onClick}
    >
      <GoogleMark className="size-4" />
      {loading ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
