import { Badge } from "@/components/ui/badge";
import type { VisualStatus } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

const LABELS: Record<VisualStatus, string> = {
  complete: "Complete",
  in_progress: "In progress",
  overdue: "Overdue",
  not_started: "Not started",
};

const STYLES: Record<VisualStatus, string> = {
  complete:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  in_progress:
    "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  overdue: "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-400",
  not_started:
    "border-muted-foreground/25 bg-muted text-muted-foreground",
};

export function StatusBadge({
  status,
  className,
}: {
  status: VisualStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", STYLES[status], className)}
    >
      {LABELS[status]}
    </Badge>
  );
}
