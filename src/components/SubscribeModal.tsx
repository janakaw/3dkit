import { Check, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";

const plans = [
  {
    slug: "freelancer",
    name: "Freelancer Plan",
    price: 19,
    target: "For 1-man indie developers, students, or freelancers with under $100k annual revenue.",
    features: [
      "5 model downloads per month",
      "Single-user commercial license for indie game releases",
      "Both high-poly and mid-poly builds",
      "Cancel anytime — files you downloaded stay licensed",
    ],
  },
  {
    slug: "studio",
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
];

export function SubscribeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="Close subscription dialog"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/60 backdrop-blur-sm"
      />
      <div className="relative my-auto max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-card p-7 shadow-2xl md:p-10">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-foreground">
          Subscribe for unlimited access
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pick the plan that matches your studio size. Download high-poly archviz models and
          mid-poly game-ready builds, cancel at any time from your account page, and keep every
          file you have already downloaded.
        </p>

        <div className="mt-7 space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col gap-6 rounded-xl border border-border bg-secondary p-6 md:flex-row md:items-center"
            >
              <div className="md:w-56 md:shrink-0">
                <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  {plan.name}
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-foreground">
                  ${plan.price}
                  <span className="text-base font-medium text-muted-foreground"> / month</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plan.target}</p>
              </div>
              <ul className="flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="md:w-48 md:shrink-0">
                <Link
                  to="/subscribe/$plan"
                  params={{ plan: plan.slug }}
                  onClick={onClose}
                  className="block rounded-full bg-brand px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-brand-foreground transition-opacity hover:opacity-90"
                >
                  Subscribe
                </Link>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Billed monthly · cancel any time
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export const SUBSCRIBE_EVENT = "3dkit:open-subscribe";

export function openSubscribe() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SUBSCRIBE_EVENT));
}
