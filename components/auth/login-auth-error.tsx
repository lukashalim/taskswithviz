interface LoginAuthErrorProps {
  show: boolean;
}

/** Shown when `/login?error=auth` (e.g. OAuth/code exchange failed). */
export function LoginAuthError({ show }: LoginAuthErrorProps) {
  if (!show) return null;

  return (
    <p className="text-sm text-destructive">
      Authentication failed. Try signing in again.
    </p>
  );
}
