import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureMedusaSession } from "@/lib/medusa/auth";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { FormAlert, type FormMessage } from "@/components/FormAlert";
import { MfaCodeField } from "@/components/MfaCodeField";
import { friendlyAuthError } from "@/lib/auth-errors";
import { needsMfaCode, verifyMfaCode } from "@/lib/mfa";

type SignInSearch = {
  mode?: "signin" | "signup" | undefined;
  redirect?: string | undefined;
};

export const Route = createFileRoute("/signin")({
  validateSearch: (search: Record<string, unknown>): SignInSearch => ({
    mode: search["mode"] === "signup" ? "signup" : undefined,
    // Only ever an internal app-relative path (see _authenticated/route.tsx,
    // the only place that sets this) — reject anything else so this can
    // never be turned into an open redirect via a hand-crafted URL.
    redirect:
      typeof search["redirect"] === "string" &&
      search["redirect"].startsWith("/") &&
      !search["redirect"].startsWith("//")
        ? search["redirect"]
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign In — 3Dkit 3D Furniture Library" },
      {
        name: "description",
        content:
          "Sign in to your 3Dkit account to download your licensed 3D furniture models and manage your subscription.",
      },
      { property: "og:title", content: "Sign In — 3Dkit" },
      { property: "og:description", content: "Access your 3Dkit downloads and subscription." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const { mode: initialMode, redirect: redirectTarget } = Route.useSearch();

  // Two separate branches (rather than one call with a ternary options
  // object) so each resolves against its own `navigate()` overload cleanly
  // under `exactOptionalPropertyTypes` — `{ href }` and `{ to }` aren't the
  // same options shape.
  const goToRedirectOrHome = async () => {
    // Establish the Medusa customer session (creating the customer on
    // first sign-in) and hand over any guest cart, before landing on the
    // page the shopper was heading to — see lib/medusa/auth.server.ts.
    try {
      await ensureMedusaSession();
    } catch (error) {
      console.warn("[signin] could not establish Medusa customer session", error);
    }
    // A plain sign-in lands on the home page; `redirect` is only set when
    // an account page (e.g. checkout) bounced the shopper here, and then
    // they go straight back to it.
    if (redirectTarget) {
      await navigate({ href: redirectTarget });
    } else {
      await navigate({ to: "/" });
    }
  };
  // "forgot" is only reachable from the "Forgot password?" link, and "mfa"
  // (the authenticator-code step) only after a correct password — the URL's
  // `mode` search param stays signin/signup.
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "mfa">(
    initialMode === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");

  // Someone who entered their password but not their code (e.g. navigated
  // away, or was sent back here by an account page) resumes at the code step.
  useEffect(() => {
    void needsMfaCode().then((needed) => {
      if (needed) setMode("mfa");
    });
  }, []);

  const cancelMfa = async () => {
    await supabase.auth.signOut();
    setMode("signin");
    setCode("");
    setMessage(null);
  };

  const submitEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      if (mode === "mfa") {
        await verifyMfaCode(code);
        await goToRedirectOrHome();
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          // Must be on the Supabase Redirect URLs allow-list, like
          // /auth/confirmed (see the signUp comment below).
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        // Same wording whether or not an account exists, so this form can't
        // be used to find out which emails are registered.
        setMessage({
          tone: "success",
          text: "If an account exists for that email, we've sent a link to reset your password. It may take a minute to arrive.",
        });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            // Without this, Supabase falls back to the project's dashboard
            // "Site URL" (defaults to http://localhost:3000 on a brand-new
            // project) for the confirmation link's redirect_to. Explicitly
            // pointing at wherever signup actually happened means it works
            // the same on 3dkit.co, 3dlounge.co, and local dev — as long as
            // each of those origins is also added to the Supabase project's
            // Auth > URL Configuration > Redirect URLs allow-list (Supabase
            // silently falls back to the Site URL if the origin isn't
            // allow-listed, rather than erroring).
            emailRedirectTo: `${window.location.origin}/auth/confirmed`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage({
            tone: "success",
            text: "Check your email to confirm your account, then sign in here.",
          });
        } else {
          await goToRedirectOrHome();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Two-step verification is on for this account: password alone isn't
        // enough, so don't finish signing in until the code checks out.
        if (await needsMfaCode()) {
          setCode("");
          setMode("mfa");
          return;
        }
        await goToRedirectOrHome();
      }
    } catch (error) {
      setMessage({ tone: "error", text: friendlyAuthError(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Your model library
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          {mode === "signin"
            ? "Sign in"
            : mode === "signup"
              ? "Create account"
              : mode === "mfa"
                ? "Enter your code"
                : "Reset password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "forgot"
            ? "Enter your account email and we'll send you a link to choose a new password."
            : mode === "mfa"
              ? "Two-step verification is on for this account. Enter the 6-digit code from your authenticator app."
              : "Save models to your personal library and access your downloads from any device."}
        </p>

        <form className="mt-8 space-y-4" onSubmit={submitEmailAuth}>
          {mode === "signup" && (
            <div>
              <label
                htmlFor="displayName"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Your name
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                placeholder="Alex Morgan"
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
              />
            </div>
          )}
          {mode === "mfa" && (
            <MfaCodeField id="mfa-code" value={code} onChange={setCode} autoFocus />
          )}
          {mode !== "mfa" && (
            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@studio.com"
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
              />
            </div>
          )}
          {(mode === "signin" || mode === "signup") && (
            <div>
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setMessage(null);
                    }}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-11 text-sm text-foreground outline-none focus:border-brand"
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
          )}
          <Button
            type="submit"
            disabled={busy || (mode === "mfa" && code.length !== 6)}
            className="h-12 w-full rounded-full uppercase tracking-wide"
          >
            {mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : mode === "mfa"
                  ? "Verify"
                  : "Send reset link"}
          </Button>
        </form>

        {message && <FormAlert message={message} className="mt-5" />}
        {mode === "mfa" ? (
          <>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Lost access to your authenticator app?{" "}
              <Link to="/support" className="font-semibold text-brand hover:underline">
                Contact support
              </Link>{" "}
              and we&apos;ll help you back in after confirming it&apos;s you.
            </p>
            <button
              type="button"
              onClick={() => void cancelMfa()}
              className="mt-6 text-center text-sm font-semibold text-brand hover:underline"
            >
              Cancel and sign out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode((current) =>
                current === "signup" ? "signin" : current === "forgot" ? "signin" : "signup",
              );
              setMessage(null);
            }}
            className="mt-6 text-center text-sm font-semibold text-brand hover:underline"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : mode === "forgot"
                ? "Back to sign in"
                : "Already have an account? Sign in"}
          </button>
        )}
        <Link
          to="/"
          className="mt-4 text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Continue browsing without an account
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
