import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildTaskEmailBodies,
  getEmailEnv,
  getResend,
  taskReplyToAddress,
} from "@/lib/email/resend-client";
import { fetchTaskByIdForUser } from "@/lib/tasks/queries";
import { taskEmailSendBodySchema } from "@/lib/validators";

export async function POST(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  let env: { from: string; inboundDomain: string };
  try {
    env = getEmailEnv();
    getResend();
  } catch {
    return NextResponse.json(
      { error: "Email is not configured (Resend / inbound domain)." },
      { status: 503 },
    );
  }

  const { taskId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await fetchTaskByIdForUser(supabase, taskId, user.id);
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = taskEmailSendBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { to, message } = parsed.data;
  const { subject, text, html } = buildTaskEmailBodies({
    task,
    optionalMessage: message,
  });
  const replyTo = taskReplyToAddress(task.id, env.inboundDomain);

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: env.from,
    to: [to],
    subject,
    text,
    html,
    replyTo: [replyTo],
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to send email" },
      { status: 502 },
    );
  }

  return NextResponse.json({ id: data?.id ?? null });
}
