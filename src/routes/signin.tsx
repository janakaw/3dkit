import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

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
  const goToRedirectOrMyModels = async () => {
    if (redirectTarget) {
      await navigate({ href: redirectTarget });
    } else {
      await navigate({ to: "/my-models" });
    }
  };
  const [mode, setMode] = useState<"signin" | "signup">(
    initialMode === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submitEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (mode === "signup") {
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
          setMessage("Check your email to confirm your account, then sign in here.");
        } else {
          await goToRedirectOrMyModels();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await goToRedirectOrMyModels();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not complete that request.");
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
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save models to your personal library and access your downloads from any device.
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
          <div>
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Password
            </label>
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
          <Button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-full uppercase tracking-wide"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        {message && <p className="mt-5 text-sm text-muted-foreground">{message}</p>}
        <button
          type="button"
          onClick={() => {
            setMode((current) => (current === "signin" ? "signup" : "signin"));
            setMessage("");
          }}
          className="mt-6 text-center text-sm font-semibold text-brand hover:underline"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
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
