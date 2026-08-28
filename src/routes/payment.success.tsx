import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Download, Mail, ReceiptText } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

type Search = { plan?: string | undefined; amount?: number | undefined };

export const Route = createFileRoute("/payment/success")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    plan: typeof search["plan"] === "string" ? (search["plan"] as string) : undefined,
    amount: Number(search["amount"]) > 0 ? Number(search["amount"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment Successful — 3Dkit" },
      {
        name: "description",
        content:
          "Your 3Dkit payment went through. Start downloading high-poly archviz and mid-poly game furniture models right away.",
      },
      { property: "og:title", content: "Payment Successful — 3Dkit" },
      { property: "og:description", content: "Your 3Dkit subscription is active." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaymentSuccess,
});

function PaymentSuccess() {
  const { plan, amount } = Route.useSearch();
  const planName = plan === "studio" ? "Studio Plan" : plan === "freelancer" ? "Freelancer Plan" : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
          <CheckCircle2 className="h-11 w-11 text-brand" aria-hidden />
        </div>
        <h1 className="mt-7 font-display text-4xl font-extrabold uppercase tracking-tight text-foreground">
          Payment successful
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {planName ? `Your ${planName} is active.` : "Your order is confirmed."} A receipt is on its
          way to your inbox and your downloads are unlocked right now.
        </p>

        <div className="mt-9 rounded-2xl bg-secondary p-6 text-left">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold text-foreground">{planName ?? "One-time purchase"}</span>
          </div>
          {amount ? (
            <div className="mt-3 flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Charged</span>
              <span className="font-semibold text-foreground">${amount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-semibold text-brand">Paid</span>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            to="/"
            hash="collection"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden />
            Start downloading
          </Link>
          <Link
            to="/support"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:border-brand hover:text-brand"
          >
            <ReceiptText className="h-4 w-4" aria-hidden />
            Billing help
          </Link>
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" aria-hidden />
          No receipt after 10 minutes? Check spam, then contact us.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
