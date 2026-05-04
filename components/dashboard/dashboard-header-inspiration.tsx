import type { TaskInspiration } from "@/lib/task-inspiration";

interface DashboardHeaderInspirationProps {
  inspiration: TaskInspiration;
}

/** Compact quote / prayer for the sticky dashboard header. */
export function DashboardHeaderInspiration({
  inspiration,
}: DashboardHeaderInspirationProps) {
  return (
    <div
      className="min-w-0 flex-1 px-1 text-center"
      aria-label="Reflection for this visit"
    >
      {inspiration.context ? (
        <p className="line-clamp-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
          {inspiration.context}
        </p>
      ) : null}
      <p className="line-clamp-2 text-xs leading-snug text-foreground sm:line-clamp-2 sm:text-sm">
        {inspiration.body}
      </p>
      <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
        — {inspiration.author}
      </p>
    </div>
  );
}
