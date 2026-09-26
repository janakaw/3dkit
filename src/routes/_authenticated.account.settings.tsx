import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AccountPage } from "@/components/AccountPage";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";
import { FormAlert, type FormMessage } from "@/components/FormAlert";
import { friendlyAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/_authenticated/account/settings")({
  head: () => ({
    meta: [{ title: "Settings — 3Dkit" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const email = user.email ?? "";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);

  // No separate "change password" form: the emailed reset link (the same
  // one "Forgot password?" sends) covers it, and proves the request came
  // from whoever controls the account's inbox.
  const sendResetLink = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setMessage({
        tone: "success",
        text: `We've sent a password reset link to ${email}. It may take a minute to arrive.`,
      });
    } catch (error) {
      setMessage({ tone: "error", text: friendlyAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccountPage title="Settings" subtitle="Sign-in and security">
      <div className="mt-12 max-w-xl space-y-10">
        <section className="border-t border-border pt-8">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <KeyRound className="h-4 w-4" aria-hidden />
            Password
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            To change your password, we'll email a secure link to{" "}
            <span className="font-medium text-foreground">{email}</span>. Open it to choose a new
            one.
          </p>
          <button
            type="button"
            onClick={() => void sendResetLink()}
            disabled={busy || !email}
            className="mt-5 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Email me a reset link"}
          </button>
          {message && <FormAlert message={message} className="mt-5" />}
        </section>

        <TwoFactorSettings />
      </div>
    </AccountPage>
  );
}
