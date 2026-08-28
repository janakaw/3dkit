import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

const plans = {
  freelancer: {
    name: "Freelancer Plan",
    price: 19,
    target: "For 1-man indie developers, students, or freelancers with under $100k annual revenue.",
    features: [
      "5 model downloads per month",
      "Single-user commercial license for indie game releases",
      "Both high-poly archviz and mid-poly game builds",
      "Cancel anytime — downloaded files stay licensed",
    ],
  },
  studio: {
    name: "Studio Plan",
    price: 49,
    target: "For small-to-medium game studios or companies with over $100k annual revenue.",
    features: [
      "15 model downloads per month",
      "Full commercial license with no revenue limits",
      "Unlimited team seats on one account",
      "Priority support and asset requests",
    ],
  },
} as const;

export const Route = createFileRoute("/subscribe/$plan")({
  loader: ({ params }) => {
    const plan = plans[params.plan as keyof typeof plans];
    if (!plan) throw notFound();
    return { plan };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Plan not found — 3Dkit" }, { name: "robots", content: "noindex" }] };
    }
    const title = `Subscribe — ${loaderData.plan.name} | 3Dkit`;
    const description = `Subscribe to the 3Dkit ${loaderData.plan.name} for $${loaderData.plan.price}/month and download original 3D furniture models. Cancel anytime.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SubscribePage,
});

function SubscribePage() {
  const { plan } = Route.useLoaderData();
  const navigate = useNavigate({ from: "/subscribe/$plan" });
  const tax = Math.round(plan.price * 0.1 * 100) / 100;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-5 py-12">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span className="px-2">/</span>
          <span className="text-foreground">Subscribe</span>
        </nav>

        <h1 className="mt-3 font-display text-3xl font-extrabold uppercase tracking-tight text-foreground">
          Subscribe — {plan.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{plan.target}</p>

        <div className="mt-9 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              const cardNumber = new FormData(e.currentTarget).get("cardNumber");
              const isDeclined = typeof cardNumber === "string" && cardNumber.replace(/\s/g, "") === "4000000000000002";
              navigate({
                to: isDeclined ? "/payment/failed" : "/payment/success",
                search: isDeclined ? { plan: plan.name === "Studio Plan" ? "studio" : "freelancer" } : { plan: plan.name === "Studio Plan" ? "studio" : "freelancer", amount: plan.price + tax },
              });
            }}
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="you@studio.com"
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Card number
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" aria-hidden />
                <input
                  name="cardNumber"
                  inputMode="numeric"
                  required
                  placeholder="4242 4242 4242 4242"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Expiry
                </label>
                <input
                  placeholder="MM / YY"
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  CVC
                </label>
                <input
                  placeholder="123"
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-brand px-8 py-4 text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
            >
              Subscribe — ${plan.price} / month
            </button>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Secure checkout · cancel anytime in 2 clicks
            </p>
          </form>

          <aside className="rounded-2xl border border-border bg-secondary p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Order summary
            </p>
            <div className="mt-4 flex items-baseline justify-between text-sm text-muted-foreground">
              <span>{plan.name}</span>
              <span className="text-foreground">${plan.price.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between text-sm text-muted-foreground">
              <span>Estimated tax</span>
              <span className="text-foreground">${tax.toFixed(2)}</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm font-semibold text-foreground">Total per month</span>
              <span className="font-display text-2xl font-extrabold text-foreground">
                ${(plan.price + tax).toFixed(2)}
              </span>
            </div>

            <ul className="mt-6 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>

            <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
              Every model is designed in our own studio, so your license is clean for commercial
              archviz and game releases.
            </p>

            <Link
              to="/subscribe/$plan"
              params={{ plan: plan.name === "Freelancer Plan" ? "studio" : "freelancer" }}
              className="mt-5 block text-center text-xs font-semibold uppercase tracking-wide text-brand transition-opacity hover:opacity-80"
            >
              Switch to {plan.name === "Freelancer Plan" ? "Studio" : "Freelancer"} plan
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
