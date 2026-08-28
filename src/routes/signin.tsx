import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/signin")({
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submitEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Check your email to confirm your account, then sign in here.");
        } else {
          await navigate({ to: "/my-models" });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: "/my-models" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not complete that request.");
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    setMessage("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setMessage(result.error instanceof Error ? result.error.message : "Google sign-in was not completed.");
      setBusy(false);
      return;
    }
    if (!result.redirected) await navigate({ to: "/my-models" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Your model library</p>
        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Save models to your personal library and access your downloads from any device.
        </p>

        <Button type="button" onClick={signInWithGoogle} disabled={busy} className="mt-8 h-12 w-full rounded-full">
          Continue with Google
        </Button>
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or email</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" onSubmit={submitEmailAuth}>
          {mode === "signup" && (
            <div>
              <label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-brand"
            />
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full uppercase tracking-wide">
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
        <Link to="/" className="mt-4 text-center text-sm text-muted-foreground hover:text-foreground">
          Continue browsing without an account
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
