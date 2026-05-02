"use client";

import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
}

export function TaskCard({
  task,
  reference,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const visual = deriveVisualStatus(task, reference);

  return (
    <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base leading-tight">{task.title}</CardTitle>
            <StatusBadge status={visual} />
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
