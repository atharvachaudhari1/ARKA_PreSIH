import { Resend } from "resend";

const FROM = "TeamUp <noreply@arkaa.online>";

/**
 * Send a transactional email via Resend. Failures are logged, never thrown,
 * so email problems don't break the underlying API operation.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", opts.to);
    return;
  }
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    });
  } catch (e) {
    console.error("[email] send failed:", e);
  }
}
