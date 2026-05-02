"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type TaskFormValues,
  taskFormSchema,
} from "@/lib/validators";
import type { Task, TaskStatus } from "@/lib/tasks/types";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  task?: Task | null;
  onSubmit: (values: {
    title: string;
    description: string | null;
    due_date: string | null;
    status: TaskStatus;
  }) => Promise<void>;
  loading?: boolean;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

export function TaskFormDialog({
  open,
  onOpenChange,
  mode,
  task,
  onSubmit,
  loading,
}: TaskFormDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      due_date: undefined,
      status: "not_started",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && task) {
      form.reset({
        title: task.title,
        description: task.description ?? "",
        due_date: task.due_date ? new Date(task.due_date) : null,
        status: task.status,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        due_date: undefined,
        status: "not_started",
      });
    }
  }, [open, mode, task, form]);

  async function handleSubmit(values: TaskFormValues) {
    const due_date = values.due_date
      ? values.due_date.toISOString()
      : null;
    const description =
      values.description?.trim() === "" ? null : values.description?.trim() ?? null;
    await onSubmit({
      title: values.title.trim(),
      description,
      due_date,
      status: values.status,
    });
  }

  const dueDate = useWatch({ control: form.control, name: "due_date" });
  const status = useWatch({ control: form.control, name: "status" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New task" : "Edit task"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a task with optional due date and status."
              : "Update details and save changes."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              {...form.register("title")}
              aria-invalid={!!form.formState.errors.title}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              rows={3}
              {...form.register("description")}
              placeholder="Optional notes…"
            />
          </div>
          <div className="grid gap-2">
            <Label>Due date</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground",
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 size-4" />
                {dueDate ? format(dueDate, "PPP") : "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate ?? undefined}
                  onSelect={(d) => form.setValue("due_date", d ?? null)}
                />
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => form.setValue("due_date", null)}
                  >
                    Clear date
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={status ?? "not_started"}
              onValueChange={(v) =>
                form.setValue("status", v as TaskStatus)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
