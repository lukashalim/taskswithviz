import { NextResponse } from "next/server";
import {
  getEmailEnv,
  getResend,
  parseTaskIdFromRecipient,
  plainTextFromInbound,
} from "@/lib/email/resend-client";
import { createAdminClient } from "@/lib/supabase/admin";

interface EmailReceivedEvent {
  type: "email.received";
  data: {
    email_id: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
  };
}

function isEmailReceivedEvent(e: unknown): e is EmailReceivedEvent {
  if (typeof e !== "object" || e === null) return false;
  const o = e as { type?: unknown; data?: unknown };
  if (o.type !== "email.received") return false;
  if (typeof o.data !== "object" || o.data === null) return false;
  const d = o.data as { email_id?: unknown; from?: unknown; to?: unknown };
  return (
    typeof d.email_id === "string" &&
    typeof d.from === "string" &&
    Array.isArray(d.to)
  );
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  let inboundDomain: string;
  try {
    inboundDomain = getEmailEnv().inboundDomain;
  } catch {
    return NextResponse.json(
      { error: "Inbound domain not configured" },
      { status: 503 },
    );
  }

  const payload = await request.text();
  const resend = getResend();

  let event: unknown;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  if (!isEmailReceivedEvent(event)) {
    return NextResponse.json({ ok: true });
  }

  const { email_id: emailId, from, to, cc = [], bcc = [] } = event.data;
  const recipients = [...to, ...cc, ...bcc];

  let taskId: string | null = null;
  for (const r of recipients) {
    const id = parseTaskIdFromRecipient(r, inboundDomain);
    if (id) {
      taskId = id;
      break;
    }
  }

  if (!taskId) {
    return NextResponse.json({ ok: true, skipped: "no_task_recipient" });
  }

  const { data: received, error: recvError } =
    await resend.emails.receiving.get(emailId);
  if (recvError || !received) {
    return NextResponse.json(
      { error: recvError?.message ?? "Could not load email body" },
      { status: 502 },
    );
  }

  const textBody = plainTextFromInbound({
    text: received.text,
    html: received.html,
  });
  if (!textBody) {
    return NextResponse.json({ ok: true, skipped: "empty_body" });
  }

  const progressBody = `Email from ${from}:\n\n${textBody}`.trim();
  if (!progressBody) {
    return NextResponse.json({ ok: true, skipped: "empty_body" });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server database not configured" },
      { status: 503 },
    );
  }

  const { data: task, error: taskError } = await admin
    .from("tasks")
    .select("id,user_id")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError || !task) {
    return NextResponse.json({ ok: true, skipped: "task_not_found" });
  }

  const { error: insertError } = await admin.from("task_updates").insert({
    task_id: task.id,
    user_id: task.user_id,
    body: progressBody,
  });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
