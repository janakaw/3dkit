import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Freelancer Plan",
    price: 19,
    target: "For 1-person indie developers, students, and freelancers with under $100k annual revenue.",
    features: [
      "Unlimited downloads, all categories",
      "Both high-poly and mid-poly builds",
      "Commercial licence on every asset",
      "Cancel anytime — keeps working till period end",
    ],
  },
  {
    name: "Studio Plan",
    price: 29,
    target: "For teams and studios of any size, with no revenue cap.",
    features: [
      "Everything in Freelancer",
      "Unlimited team seats on one account",
      "Priority support and asset requests",
      "Cancel anytime — keeps working till period end",
    ],
  },
];

export function SubscribeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        aria-label="Close subscription dialog"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
      />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-7 shadow-2xl md:p-10">
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
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          One subscription, the whole library. Download any model in both high-poly and mid-poly
          builds, as often as you like — and cancel at any time from your account page. No
          contract, no download limits, and every file you have already downloaded stays licensed
          to you.
        </p>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col rounded-xl border border-border bg-secondary p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
                {plan.name}
              </p>
              <p className="mt-2 font-display text-3xl font-extrabold text-foreground">
                ${plan.price}
                <span className="text-base font-medium text-muted-foreground"> / month</span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plan.target}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90">
                Start free trial
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                7 days free · cancel any time in 2 clicks
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
