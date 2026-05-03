"use client";

import { format } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  PanelRight,
  Timer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deriveVisualStatus } from "@/lib/tasks/derive";
import type { Task } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { DaysRing } from "./days-ring";
import { StatusBadge } from "./status-badge";

interface TaskCardProps {
  task: Task;
  reference: Date;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  activeSessionTaskId?: string | null;
  onStartWorkSession?: (task: Task) => void;
}

export function TaskCard({
  task,
  reference,
  onEdit,
  onDelete,
  activeSessionTaskId = null,
  onStartWorkSession,
}: TaskCardProps) {
  const router = useRouter();
  const visual = deriveVisualStatus(task, reference);
  const detailHref = `/dashboard/tasks/${task.id}`;
  const isFocusTask = activeSessionTaskId === task.id;

  return (
    <Card
      className={cn(
        "border-border/80 shadow-sm transition-shadow hover:shadow-md",
        isFocusTask &&
          "ring-2 ring-violet-500/50 ring-offset-2 ring-offset-background",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base leading-tight">
              <Link
                href={detailHref}
                className="hover:text-primary hover:underline"
              >
                {task.title}
              </Link>
            </CardTitle>
            <StatusBadge status={visual} />
            {isFocusTask ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300"
                title="Active focus session"
              >
                <Timer className="size-3" />
                Focus
              </span>
            ) : null}
          </div>
          {task.due_date ? (
            <CardDescription className="text-xs">
              Due {format(new Date(task.due_date), "PPP")}
            </CardDescription>
          ) : (
            <CardDescription className="text-xs">No due date</CardDescription>
          )}
        </div>
        <div className="flex shrink-0 items-start gap-2">
          <DaysRing task={task} reference={reference} />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "shrink-0",
              )}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(detailHref)}>
                <PanelRight className="mr-2 size-4" />
                Open details
              </DropdownMenuItem>
              {onStartWorkSession ? (
                <DropdownMenuItem
                  onClick={() => onStartWorkSession(task)}
                  disabled={isFocusTask}
                >
                  <Timer className="mr-2 size-4" />
                  {isFocusTask ? "Focus session active" : "Start focus session"}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(task)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      {task.description ? (
        <CardContent className="pt-0">
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {task.description}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}
