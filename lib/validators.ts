import { z } from "zod";

export const taskStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "complete",
]);

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().optional(),
  due_date: z.date().nullable().optional(),
  status: taskStatusSchema,
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
