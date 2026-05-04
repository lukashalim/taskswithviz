import { Resend } from "resend";
import type { Task } from "@/lib/tasks/types";

/**
 * Email / Resend environment (server only):
 *
 * - `RESEND_API_KEY` — API key from Resend (sending + receiving.get).
 * - `RESEND_FROM` — verified sender, e.g. `Acme <onboarding@yourdomain.com>`.
 * - `RESEND_INBOUND_DOMAIN` — receiving hostname (e.g. `*.resend.app` domain
 *   from Dashboard → Emails → Receiving), used for `reply_to` and inbound routing.
 * - `RESEND_WEBHOOK_SECRET` — signing secret from Resend Webhooks (verify inbound events).
 * - `SUPABASE_SERVICE_ROLE_KEY` — used only by `/api/webhooks/resend` to insert `task_updates`.
 * - `NEXT_PUBLIC_APP_URL` (optional) — absolute origin for task links in outbound email;
 *   falls back to `https://${VERCEL_URL}` on Vercel when unset.
 */

let resendSingleton: Resend | null = null;

export function getResend(): Resend {
  if (!resendSingleton) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("Missing RESEND_API_KEY");
    }
    resendSingleton = new Resend(key);
  }
  return resendSingleton;
}

export function getEmailEnv(): {
  from: string;
  inboundDomain: string;
} {
  const from = process.env.RESEND_FROM?.trim();
  const inboundDomain = process.env.RESEND_INBOUND_DOMAIN?.trim().toLowerCase();
  if (!from) throw new Error("Missing RESEND_FROM");
  if (!inboundDomain) throw new Error("Missing RESEND_INBOUND_DOMAIN");
  return { from, inboundDomain };
}

export function taskReplyToAddress(taskId: string, inboundDomain: string): string {
  return `task+${taskId}@${inboundDomain}`;
}

/** Parse `task+<uuid>@inboundDomain` from a full To/Cc address string. */
export function parseTaskIdFromRecipient(
  raw: string,
  inboundDomain: string,
): string | null {
  const normalizedDomain = inboundDomain.toLowerCase();
  const addr = extractEmailAddress(raw).toLowerCase();
  const at = addr.lastIndexOf("@");
  if (at <= 0) return null;
  const local = addr.slice(0, at);
  const host = addr.slice(at + 1);
  if (host !== normalizedDomain) return null;
  const m = /^task\+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(
    local,
  );
  return m ? m[1] : null;
}

function extractEmailAddress(raw: string): string {
  const trimmed = raw.trim();
  const angle = /<([^>]+)>/.exec(trimmed);
  if (angle) return angle[1].trim();
  return trimmed;
}

export function getAppOriginForEmail(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "";
}

export function buildTaskEmailBodies(params: {
  task: Task;
  optionalMessage?: string;
}): { subject: string; text: string; html: string } {
  const { task, optionalMessage } = params;
  const origin = getAppOriginForEmail();
  const taskUrl =
    origin.length > 0
      ? `${origin}/dashboard/tasks/${task.id}`
      : `/dashboard/tasks/${task.id}`;

  const subject = `Task: ${task.title}`;

  const lines: string[] = [
    task.title,
    "",
    task.description?.trim()
      ? `Description:\n${task.description.trim()}`
      : "No description in the tracker.",
    "",
    `Status: ${task.status.replace("_", " ")}`,
    task.due_date ? `Due: ${task.due_date}` : "Due: (not set)",
    task.percent_done != null
      ? `Progress estimate: ${task.percent_done}%`
      : "Progress estimate: (not set)",
    "",
    optionalMessage?.trim()
      ? `Note from sender:\n${optionalMessage.trim()}`
      : null,
    "",
    origin.length > 0 ? `Open in app: ${taskUrl}` : `Open in app: (set NEXT_PUBLIC_APP_URL) ${taskUrl}`,
    "",
    "Reply to this email to add a progress update to this task in the app.",
  ].filter(Boolean) as string[];

  const text = lines.join("\n");

  const safeTitle = escapeHtml(task.title);
  const descHtml = task.description?.trim()
    ? `<p><strong>Description</strong></p><p>${escapeHtml(task.description.trim()).replace(/\n/g, "<br/>")}</p>`
    : "<p><em>No description in the tracker.</em></p>";

  const noteHtml = optionalMessage?.trim()
    ? `<p><strong>Note from sender</strong></p><p>${escapeHtml(optionalMessage.trim()).replace(/\n/g, "<br/>")}</p>`
    : "";

  const linkBlock =
    origin.length > 0
      ? `<p><a href="${escapeHtml(taskUrl)}">Open task in app</a></p>`
      : `<p>Open task path: <code>${escapeHtml(taskUrl)}</code> (set NEXT_PUBLIC_APP_URL for a clickable link)</p>`;

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111">
<p><strong>${safeTitle}</strong></p>
${descHtml}
<p><strong>Status</strong> ${escapeHtml(task.status.replace("_", " "))}<br/>
<strong>Due</strong> ${escapeHtml(task.due_date ?? "(not set)")}<br/>
<strong>Progress estimate</strong> ${task.percent_done != null ? `${escapeHtml(String(task.percent_done))}%` : "(not set)"}</p>
${noteHtml}
${linkBlock}
<p style="color:#555;font-size:13px">Reply to this email to add a progress update to this task in the app.</p>
</body></html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function plainTextFromInbound(params: {
  text: string | null | undefined;
  html: string | null | undefined;
}): string {
  const t = params.text?.trim();
  if (t) return t;
  const h = params.html?.trim();
  if (!h) return "";
  return h
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
