function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

/**
 * App origin for Supabase auth redirects (OAuth `redirectTo`, etc.).
 *
 * On a real deployed host, always uses `window.location.origin` so login
 * returns to the URL you are on (production, preview, or custom domain).
 * This avoids OAuth sending users to localhost when `NEXT_PUBLIC_SITE_URL`
 * is mistakenly set to localhost on Vercel.
 *
 * On localhost, uses `NEXT_PUBLIC_SITE_URL` when set, else the current origin.
 */
export function getAuthSiteOrigin(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const { hostname, origin } = window.location;

  if (!isLocalHostname(hostname)) {
    return trimTrailingSlash(origin);
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }

  return trimTrailingSlash(origin);
}
