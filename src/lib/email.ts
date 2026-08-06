import "server-only";

import { Resend } from "resend";

/**
 * Transactional email, currently only team invitations.
 *
 * `server-only` first, for the same reason as `s3.ts`: if a client component
 * ever imports this the build fails, rather than shipping RESEND_API_KEY to the
 * browser. The client is built on first use rather than at import time so the
 * missing-key error surfaces at the call, not at module load — which would take
 * the whole app down instead of one action.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const globalForResend = globalThis as unknown as { _tpResend?: Resend };

function client(): Resend {
  globalForResend._tpResend ??= new Resend(required("RESEND_API_KEY"));
  return globalForResend._tpResend;
}

/** Whether email is configured at all. Invites still work without it. */
export function emailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export type SendResult = { ok: true } | { ok: false; reason: string };

/**
 * Never throws.
 *
 * An invitation is recorded in the database before this is called, and the link
 * is shown on screen regardless — so a bounced email must not roll back a real
 * invitation or surface as a failed action. The caller reports delivery
 * separately from whether the invite exists.
 */
export async function sendInviteEmail(input: {
  to: string;
  teamName: string;
  inviterName: string;
  acceptUrl: string;
}): Promise<SendResult> {
  if (!emailIsConfigured()) {
    return { ok: false, reason: "Email is not configured on this server." };
  }

  try {
    const { error } = await client().emails.send({
      from: required("EMAIL_FROM"),
      to: input.to,
      subject: `${input.inviterName} invited you to ${input.teamName} on Training Planner`,
      html: inviteHtml(input),
      text:
        `${input.inviterName} has invited you to join ${input.teamName} on Training Planner.\n\n` +
        `Accept the invitation:\n${input.acceptUrl}\n\n` +
        `The link expires in 7 days. If you were not expecting this, ignore it.`,
    });

    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (cause) {
    console.error("[email] invite send failed", cause);
    return { ok: false, reason: cause instanceof Error ? cause.message : "Could not send the email." };
  }
}

/** Inline styles and a table-free layout: mail clients support little else. */
function inviteHtml({
  teamName,
  inviterName,
  acceptUrl,
}: {
  teamName: string;
  inviterName: string;
  acceptUrl: string;
}): string {
  const escape = (value: string) =>
    value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1c16">
  <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:24px">trainingplanner</div>
  <p style="font-size:16px;line-height:1.6;margin:0 0 8px">
    <strong>${escape(inviterName)}</strong> has invited you to join
    <strong>${escape(teamName)}</strong>.
  </p>
  <p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0 0 24px">
    You will be able to see and edit every training plan in the team.
  </p>
  <a href="${escape(acceptUrl)}"
     style="display:inline-block;background:#c6e625;color:#1a1c16;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:999px">
    Accept the invitation
  </a>
  <p style="font-size:12px;line-height:1.6;color:#9ca3af;margin:24px 0 0">
    The link expires in 7 days. If you were not expecting this, ignore it.
  </p>
</div>`;
}
