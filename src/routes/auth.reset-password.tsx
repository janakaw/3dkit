import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FormAlert, type FormMessage } from "@/components/FormAlert";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { MfaCodeField } from "@/components/MfaCodeField";
import { friendlyAuthError } from "@/lib/auth-errors";
import { needsMfaCode, verifyMfaCode } from "@/lib/mfa";

// Landing page for the "reset your password" email link (sent from the
// sign-in page's "Forgot password?" and from Account → Settings). Supabase
// signs the shopper in from the link's URL hash; this page then lets them
// choose a new password.
export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [{ title: "Choose a new password — 3Dkit" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "invalid" | "done";

function ResetPasswordPage() {
  const navigate = useNavigate();
  // Read before supabase-js strips the hash (same trick as auth.confirmed).
  // Only a genuine recovery link unlocks the form, so an already-signed-in
  // visitor can't just open this URL and change the password without the
  // email step.
  const [isRecoveryLink] = useState(
    () => typeof window !== "undefined" && window.location.hash.includes("type=recovery"),
  );
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<FormMessage | null>(null);
  // The reset link signs in at aal1; with two-step verification on,
  // Supabase won't change the password until a code lifts it to aal2.
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (status === "ready") void needsMfaCode().then(setNeedsCode);
  }, [status]);

  useEffect(() => {
    if (!isRecoveryLink) {
      setStatus("invalid");
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setStatus("ready");
    });
    // The hash is processed asynchronously, so also wait for the session.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setStatus("ready");
      }
    });
    // A link that never yields a session (expired / already used).
    const timeout = window.setTimeout(() => {
      if (active) setStatus((current) => (current === "checking" ? "invalid" : current));
    }, 5000);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, [isRecoveryLink]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (password !== confirm) {
      setMessage({ tone: "error", text: "The two passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      if (needsCode) {
        await verifyMfaCode(code);
        setNeedsCode(false);
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("done");
    } catch (error) {
      setMessage({ tone: "error", text: friendlyAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3 pr-11 text-sm text-foreground outline-none focus:border-brand";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Account</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          {status === "done" ? "Password updated" : "Choose a new password"}
        </h1>

        {status === "checking" && (
          <Loader2 className="mt-8 h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        )}

        {status === "invalid" && (
          <>
            <FormAlert
              className="mt-6"
              message={{
                tone: "error",
                text: "This reset link is invalid or has expired. Please request a new one.",
              }}
            />
            <Link
              to="/signin"
              className="mt-6 text-center text-sm font-semibold text-brand hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}

        {status === "ready" && (
          <form className="mt-8 space-y-4" onSubmit={submit}>
            <div>
              <label
                htmlFor="new-password"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                New password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                minLength={6}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            {needsCode && (
              <MfaCodeField
                id="reset-mfa-code"
                label="Code from your authenticator app"
                value={code}
                onChange={setCode}
              />
            )}
            {message && <FormAlert message={message} />}
            <Button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-full uppercase tracking-wide"
            >
              Save new password
            </Button>
          </form>
        )}

        {status === "done" && (
          <>
            <FormAlert
              className="mt-6"
              message={{
                tone: "success",
                text: "Your password has been changed and you're signed in.",
              }}
            />
            <Button
              type="button"
              onClick={() => void navigate({ to: "/" })}
              className="mt-6 h-12 w-full rounded-full uppercase tracking-wide"
            >
              Continue to 3Dkit
            </Button>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
