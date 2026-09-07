/**
 * Server-only Resend client for transactional emails sent directly from
 * the 3dkit frontend (as opposed to the Medusa backend's own Resend
 * integration, which handles order-confirmation receipts — see the
 * decisions doc, Tier 5). This one is for auth-adjacent emails the
 * Supabase project itself doesn't send, like the post-confirmation
 * welcome email.
 *
 * Never import this from a route component or loader body directly — it
 * reads `process.env`, which only exists server-side. Only import it from
 * a `createServerFn()` handler (see send-welcome-email.ts).
 */
import { Resend } from "resend";

function createResendClient(): Resend {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }
  return new Resend(apiKey);
}

let _resend: Resend | undefined;
function getResendClient(): Resend {
  if (!_resend) _resend = createResendClient();
  return _resend;
}

type WelcomeEmailInput = {
  email: string;
  displayName?: string | null | undefined;
};

export async function sendWelcomeEmail({ email, displayName }: WelcomeEmailInput): Promise<void> {
  const from = process.env["RESEND_FROM_EMAIL"];
  if (!from) {
    console.error("[resend] sendWelcomeEmail: missing RESEND_FROM_EMAIL environment variable");
    throw new Error("Missing RESEND_FROM_EMAIL environment variable.");
  }
  // Runs in the Cloudflare Worker, so this lands in Cloudflare's own
  // Workers logs — the durable half, unlike a client-side console.log
  // that's only visible if devtools happened to be open. This is the
  // trace that tells us whether the request even reached this server
  // function at all (as opposed to auth.confirmed.tsx never calling it —
  // see that file's own logging for the other half of this).
  console.log("[resend] sendWelcomeEmail: attempting send", { to: email, from });

  const name = displayName?.trim() || email.split("@")[0] || email;

  const { error } = await getResendClient().emails.send({
    from,
    to: [email],
    subject: "You're all set — welcome to 3Dkit",
    html: `
      <div style="font-family: Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #18181b;">
        <h1 style="font-size: 20px; font-weight: 800; margin: 0 0 16px;">Welcome, ${escapeHtml(name)}!</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #52525b; margin: 0 0 16px;">
          Your email is confirmed and your 3Dkit account is ready to go. You can sign in any time to
          save models to your library and access your downloads from any device.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #52525b; margin: 0;">
          — The 3Dkit team
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[resend] sendWelcomeEmail: Resend API returned an error", { to: email, error });
    throw new Error(`Resend failed to send welcome email to ${email}: ${JSON.stringify(error)}`);
  }
  console.log("[resend] sendWelcomeEmail: send succeeded", { to: email });
}

// Minimal escaping — display_name is user-supplied free text that goes
// straight into an HTML email body.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
