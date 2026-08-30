import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendWelcomeEmail } from "@/integrations/resend/send-welcome-email";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth/confirmed")({
  head: () => ({
    meta: [{ title: "Email Confirmed — 3Dkit" }, { name: "robots", content: "noindex" }],
  }),
  component: EmailConfirmedPage,
});

type Status = "checking" | "confirmed" | "invalid";

function EmailConfirmedPage() {
  const [status, setStatus] = useState<Status>("checking");
  // Captured synchronously on first render, before supabase-js's
  // detectSessionInUrl processes and strips the URL hash — the only
  // reliable signal that this exact page load is the result of clicking a
  // signup confirmation link (implicit flow puts `type=signup` in the
  // hash), as opposed to someone just returning to this URL later.
  const [wasSignupLink] = useState(
    () => typeof window !== "undefined" && window.location.hash.includes("type=signup"),
  );
  const welcomeEmailSent = useRef(false);

  useEffect(() => {
    let active = true;

    const maybeSendWelcomeEmail = (session: {
      user: { email?: string; user_metadata: Record<string, unknown> };
    }) => {
      if (!wasSignupLink || welcomeEmailSent.current) return;
      const email = session.user.email;
      if (!email) return;
      welcomeEmailSent.current = true;
      const displayName = session.user.user_metadata["display_name"];
      // Best-effort — a failure here shouldn't block the user from seeing
      // their account is confirmed and working.
      void sendWelcomeEmail({
        data: { email, displayName: typeof displayName === "string" ? displayName : undefined },
      }).catch((error: unknown) => {
        console.error("[auth/confirmed] Welcome email failed to send:", error);
      });
    };

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setStatus("confirmed");
        maybeSendWelcomeEmail(data.session);
      } else {
        setStatus("invalid");
      }
    };
    void checkSession();

    // detectSessionInUrl's own processing is async and can resolve
    // slightly after this component's first render — listen for it too,
    // not just the one-shot getSession() call above, so a session that
    // lands a beat late still flips the page to "confirmed".
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        setStatus("confirmed");
        maybeSendWelcomeEmail(session);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [wasSignupLink]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        {status === "checking" && (
          <>
            <Loader2 className="mx-auto h-11 w-11 animate-spin text-muted-foreground" aria-hidden />
            <h1 className="mt-6 font-display text-2xl font-extrabold uppercase tracking-tight text-foreground">
              Confirming your email…
            </h1>
          </>
        )}

        {status === "confirmed" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
              <CheckCircle2 className="h-11 w-11 text-brand" aria-hidden />
            </div>
            <h1 className="mt-7 font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
              Email confirmed
            </h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Your account is verified and you&apos;re signed in. We&apos;ve also sent a
              confirmation to your inbox for your records.
            </p>
            <Link
              to="/my-models"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-brand px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
            >
              Go to My Models
            </Link>
          </>
        )}

        {status === "invalid" && (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-11 w-11 text-destructive" aria-hidden />
            </div>
            <h1 className="mt-7 font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
              Link invalid or expired
            </h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              This confirmation link didn&apos;t work. Try signing up again, or sign in if
              you&apos;ve already confirmed your email another way.
            </p>
            <Link
              to="/signin"
              search={{ mode: "signup" }}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-brand px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
            >
              Back to sign up
            </Link>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
