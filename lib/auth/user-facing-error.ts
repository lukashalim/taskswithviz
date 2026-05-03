export function authErrorMessage(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : "Something went wrong";

  if (raw.toLowerCase().includes("rate limit")) {
    return "Too many requests. Wait several minutes and try again.";
  }

  return raw;
}
