export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <div
        className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
