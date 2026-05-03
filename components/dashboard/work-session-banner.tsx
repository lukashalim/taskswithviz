"use client";

import Link from "next/link";
import { Square } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatElapsedFromSeconds, elapsedSeconds } from "@/lib/tasks/format-elapsed";
import type { TaskWorkSession } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface WorkSessionBannerProps {
  openSession: TaskWorkSession;
  taskTitle: string;
  /** Live "now" for elapsed display */
  tick: Date;
  onStop: () => void;
  stopping?: boolean;
}

export function WorkSessionBanner({
  openSession,
  taskTitle,
  tick,
  onStop,
  stopping,
}: WorkSessionBannerProps) {
  const sec = elapsedSeconds(new Date(openSession.started_at), tick);

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-violet-500/35 bg-violet-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          Focus session ·{" "}
          <span className="tabular-nums text-violet-700 dark:text-violet-300">
            {formatElapsedFromSeconds(sec)}
          </span>
        </p>
        <p className="truncate text-sm text-muted-foreground">
          <Link
            href={`/dashboard/tasks/${openSession.task_id}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {taskTitle}
          </Link>
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link
          href={`/dashboard/tasks/${openSession.task_id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Open task
        </Link>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-1.5"
          disabled={stopping}
          onClick={onStop}
        >
          <Square className="size-3.5 fill-current" />
          {stopping ? "Stopping…" : "Stop"}
        </Button>
      </div>
    </div>
  );
}
