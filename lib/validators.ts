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
  percent_done: z
    .number()
    .int()
    .min(0)
    .max(100)
    .nullable()
    .optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const taskProgressUpdateBodySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a short update")
    .max(4000, "Update is too long"),
});

export type TaskProgressUpdateFormValues = z.infer<
  typeof taskProgressUpdateBodySchema
>;

export const taskEmailSendBodySchema = z.object({
  to: z.string().trim().email("Enter a valid email address"),
  message: z.string().trim().max(4000, "Message is too long").optional(),
});

export type TaskEmailSendBody = z.infer<typeof taskEmailSendBodySchema>;
