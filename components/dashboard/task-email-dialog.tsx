"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  taskEmailSendBodySchema,
  type TaskEmailSendBody,
} from "@/lib/validators";
import { toast } from "sonner";

interface TaskEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
}

export function TaskEmailDialog({
  open,
  onOpenChange,
  taskId,
}: TaskEmailDialogProps) {
  const form = useForm<TaskEmailSendBody>({
    resolver: zodResolver(taskEmailSendBodySchema),
    defaultValues: { to: "", message: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ to: "", message: "" });
  }, [open, form]);

  async function onSubmit(values: TaskEmailSendBody) {
    const res = await fetch(`/api/tasks/${taskId}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: values.to,
        message: values.message?.trim() ? values.message : undefined,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      error?: unknown;
    };

    if (!res.ok) {
      let msg = "Could not send email";
      if (typeof payload.error === "string") {
        msg = payload.error;
      } else if (
        payload.error &&
        typeof payload.error === "object" &&
        "to" in payload.error &&
        Array.isArray((payload.error as { to?: unknown }).to)
      ) {
        const first = (payload.error as { to: string[] }).to[0];
        if (first) msg = first;
      }
      toast.error(msg);
      return;
    }

    toast.success("Email sent");
    form.reset({ to: "", message: "" });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-4 shrink-0" />
            Email about this task
          </DialogTitle>
          <DialogDescription>
            Sends a summary of this task. Replies to that message are saved as
            progress updates when inbound email is configured in Resend.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="task-email-to">To</Label>
            <Input
              id="task-email-to"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={form.formState.isSubmitting}
              {...form.register("to")}
            />
            {form.formState.errors.to ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.to.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-email-message">Optional note</Label>
            <Textarea
              id="task-email-message"
              rows={3}
              placeholder="Short context for the recipient…"
              className="resize-y min-h-[80px]"
              disabled={form.formState.isSubmitting}
              {...form.register("message")}
            />
            {form.formState.errors.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.message.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className="border-t-0 bg-transparent p-0 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
