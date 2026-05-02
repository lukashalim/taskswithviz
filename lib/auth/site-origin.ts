const PRODUCTION_SITE_ORIGIN = "https://taskswithviz-three.vercel.app";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Origin used for Supabase emailRedirectTo (magic link, signup confirm).
 * Local dev uses the current browser origin; deployed builds use
 * NEXT_PUBLIC_SITE_URL when set, otherwise the production Vercel URL.
 */
export function getAuthSiteOrigin(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }

  const { hostname, origin } = window.location;
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]";

  if (isLocal) {
    return origin;
  }

  return PRODUCTION_SITE_ORIGIN;
}
