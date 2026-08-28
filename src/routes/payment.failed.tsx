import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, HelpCircle, RefreshCw } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

type Search = { plan?: string | undefined };

export const Route = createFileRoute("/payment/failed")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    plan: typeof search["plan"] === "string" ? (search["plan"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment Could Not Be Completed — 3Dkit" },
      {
        name: "description",
        content:
          "Your 3Dkit payment was not completed. Return to checkout or contact support for help.",
      },
      { property: "og:title", content: "Payment Could Not Be Completed — 3Dkit" },
      { property: "og:description", content: "Get help completing your 3Dkit payment." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaymentFailed,
});

function PaymentFailed() {
  const { plan } = Route.useSearch();
  const checkoutPlan = plan === "studio" || plan === "freelancer" ? plan : "freelancer";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-11 w-11 text-destructive" aria-hidden />
        </div>
        <h1 className="mt-7 font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
          Payment not completed
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Nothing was charged. Your payment may have been cancelled, declined, or interrupted. You
          can try again with the same plan or use another payment method.
        </p>

        <div className="mt-9 rounded-2xl bg-secondary p-6 text-left">
          <p className="flex items-center gap-3 text-sm font-semibold text-foreground">
            <HelpCircle className="h-5 w-5 text-brand" aria-hidden />
            Before you try again
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Check that your card details and billing address are correct.</li>
            <li>• Make sure your bank allows online or international payments.</li>
            <li>• If your bank shows a pending hold, it should disappear automatically.</li>
          </ul>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            to="/subscribe/$plan"
            params={{ plan: checkoutPlan }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Try again
          </Link>
          <Link
            to="/support"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-brand hover:text-brand"
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
            Contact support
          </Link>
        </div>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Return to the collection
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
